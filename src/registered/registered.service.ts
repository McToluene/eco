import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Registered } from './schemas/registered.schema';
import { Model } from 'mongoose';
import { PollingUnit } from '../ward/schemas/polling.schema';
import { RegisteredHelper } from './helpers/registered.helper';
import { UploadApiResponse, UploadApiErrorResponse, v2 } from 'cloudinary';
import { ConfigService } from '@nestjs/config';
import { PollingUnitNotFoundException, InsufficientRegisteredVotersException } from '../exceptions/business.exceptions';
import { StringUtils } from '../utils/common.utils';
import { WardService } from '../ward/ward.service';

@Injectable()
export class RegisteredService {
  private readonly logger = new Logger(RegisteredService.name);

  constructor(
    @InjectModel(Registered.name)
    private registeredModel: Model<Registered>,

    @InjectModel(PollingUnit.name)
    private pollingUnitModel: Model<PollingUnit>,
    config: ConfigService,
    @Inject(forwardRef(() => WardService))
    private wardService: WardService,
  ) {
    v2.config({
      cloud_name: config.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: config.get<string>('CLOUDINARY_API_KEY'),
      api_secret: config.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  async upload(
    pollingUnitId: string,
    file: Express.Multer.File,
  ): Promise<void> {
    const pu = await this.pollingUnitModel.findById(pollingUnitId).exec();
    if (!pu) throw new PollingUnitNotFoundException();
    const fileExtension = StringUtils.getFileExtension(file.originalname);
    let data: any[];
    if (fileExtension === 'xlsx') data = RegisteredHelper.processFile(file);
    if (fileExtension === 'csv')
      data = await RegisteredHelper.processFileCsv(file);

    const registeredVoters: Registered[] = data.map((data, i) => {
      const voter = new Registered();
      voter.name = data['NAME'];
      voter.id = data['ID'];
      voter.gender = data['GENDER'];
      voter.dob = data['DOB'];
      voter.pollingUnit = pu;
      voter.refIndex = i + 1;
      return voter;
    });

    await this.registeredModel.insertMany(registeredVoters);
  }

  async findRegisteredVoters(pollingUnitId: string, onlyWithoutImage: boolean = false): Promise<Registered[]> {
    const pu = await this.pollingUnitModel.findById(pollingUnitId).exec();
    if (!pu) throw new PollingUnitNotFoundException();

    const filter: any = { pollingUnit: pu };
    if (onlyWithoutImage) {
      filter.$or = [
        { imageUrl: { $exists: false } },
        { imageUrl: null },
        { imageUrl: '' },
      ];
    }

    return await this.registeredModel
      .find(filter)
      .sort({ name: 1 })
      .exec();
  }

  async deleteRegistered(pollingUnitId: string, onlyWithoutImage: boolean = false): Promise<number> {
    const pu = await this.pollingUnitModel.findById(pollingUnitId).exec();
    if (!pu) throw new PollingUnitNotFoundException();

    // Build filter: always scope to the polling unit
    const filter: any = { pollingUnit: pu };

    // If onlyWithoutImage flag is true, restrict deletion to records
    // that do not have an `imageUrl` (null, empty string, or missing)
    if (onlyWithoutImage) {
      filter.$or = [
        { imageUrl: { $exists: false } },
        { imageUrl: null },
        { imageUrl: '' },
      ];
    }

    const result = await this.registeredModel.deleteMany(filter).exec();
    // deletedCount may be undefined in some drivers, default to 0
    return (result && (result as any).deletedCount) || 0;
  }

  async uploadFile(
    data: Express.Multer.File,
  ): Promise<{ url: string; publicId: string }> {
    const response: UploadApiResponse | UploadApiErrorResponse =
      await new Promise((resolve, reject) => {
        v2.uploader
          .upload_stream(
            {
              resource_type: 'auto',
              folder: 'election',
            },

            (error, result) => {
              if (error) return reject(error);
              resolve(result);
            },
          )
          .end(data.buffer);
      });
    this.logger.debug('Image upload response: ', response);
    if (response.secure_url && response.public_id) {
      return { url: response.secure_url, publicId: response.public_id };
    }
  }

  async uploadMultipleFiles(
    files: Express.Multer.File[],
    pollingUnitId: string,
  ): Promise<void> {
    const pollingUnit = await this.pollingUnitModel
      .findById(pollingUnitId)
      .exec();
    if (!pollingUnit) throw new PollingUnitNotFoundException();

    // Extract refIndexes from filenames
    const refIndexes = files
      .map((file) => {
        if (file.originalname.includes('-')) {
          const splitedName = file.originalname.split('-');
          if (splitedName[1]) {
            const splitedNumber = splitedName[1].split('.');
            return splitedNumber[0];
          }
        } else {
          const splitedNumber = file.originalname.split('.');
          return splitedNumber[0];
        }
        return null;
      })
      .filter(Boolean);

    // Batch validate all refIndexes exist in the database
    const validRefIndexes = await this.registeredModel
      .find({
        refIndex: { $in: refIndexes },
        pollingUnit,
      })
      .select('refIndex')
      .lean()
      .exec();

    const validRefIndexSet = new Set(
      validRefIndexes.map((v) => v.refIndex.toString()),
    );

    // Upload files in parallel with concurrency limit
    const CONCURRENT_UPLOADS = 10; // Adjust based on Cloudinary rate limits
    const uploadPromises = [];

    for (let i = 0; i < files.length; i += CONCURRENT_UPLOADS) {
      const batch = files.slice(i, i + CONCURRENT_UPLOADS);
      const batchPromises = batch.map(async (file) => {
        let refIndex: string;
        if (file.originalname.includes('-')) {
          const splitedName = file.originalname.split('-');
          if (splitedName[1]) {
            const splitedNumber = splitedName[1].split('.');
            refIndex = splitedNumber[0];
          }
        } else {
          const splitedNumber = file.originalname.split('.');
          refIndex = splitedNumber[0];
        }

        if (refIndex && validRefIndexSet.has(refIndex)) {
          try {
            const result = await this.uploadFile(file);
            return { refIndex, result };
          } catch (error) {
            this.logger.error(
              `Failed to upload file ${file.originalname}: ${error.message}`,
            );
            return null;
          }
        }
        return null;
      });

      const batchResults = await Promise.all(batchPromises);
      uploadPromises.push(...batchResults.filter(Boolean));
    }

    // Batch update database using bulkWrite
    if (uploadPromises.length > 0) {
      const bulkOps = uploadPromises.map((up) => ({
        updateOne: {
          filter: {
            refIndex: parseInt(up.refIndex),
            pollingUnit: pollingUnit,
          },
          update: { $set: { imageUrl: up.result.url } },
        },
      }));

      await this.registeredModel.bulkWrite(bulkOps as any);
      this.logger.log(
        `Successfully uploaded and updated ${uploadPromises.length} images`,
      );
    }
  }

  async countRegisteredVotersByPollingUnit(pollingUnitId: string): Promise<number> {
    this.logger.log('Counting registered voters for polling unit');
    return await this.registeredModel.countDocuments({ pollingUnit: pollingUnitId });
  }

  async countRegisteredVotersByPollingUnits(pollingUnitIds: string[]): Promise<Map<string, number>> {
    this.logger.log('Counting registered voters for multiple polling units');
    const counts = await this.registeredModel.aggregate([
      { $match: { pollingUnit: { $in: pollingUnitIds.map(id => id) } } },
      { $group: { _id: '$pollingUnit', count: { $sum: 1 } } }
    ]);

    const countsMap = new Map<string, number>();
    counts.forEach(item => {
      countsMap.set(item._id.toString(), item.count);
    });

    return countsMap;
  }

  async moveRegisteredVoters(
    fromPollingUnitId: string,
    toPollingUnitId: string,
    count?: number,
    refIndex: number = 0,
  ): Promise<void> {
    // Verify both polling units exist
    const [fromPu, toPu] = await Promise.all([
      this.pollingUnitModel.findById(fromPollingUnitId).exec(),
      this.pollingUnitModel.findById(toPollingUnitId).exec(),
    ]);

    if (!fromPu) {
      throw new PollingUnitNotFoundException();
    }

    if (!toPu) {
      throw new PollingUnitNotFoundException();
    }

    // Get the registered voters to move from the source polling unit
    // If refIndex is provided, filter by refIndex, otherwise get all voters
    const query = refIndex > 0
      ? { pollingUnit: fromPu, refIndex: { $gte: refIndex } }
      : { pollingUnit: fromPu };

    // Get all voters matching the query for randomization
    const allVoters = await this.registeredModel
      .find(query)
      .exec();

    if (allVoters.length === 0) {
      throw new InsufficientRegisteredVotersException();
    }

    // If count is not provided, move all voters; otherwise check if enough voters exist
    let votersToMove;
    if (count) {
      if (allVoters.length < count) {
        throw new InsufficientRegisteredVotersException();
      }

      // Randomize and select the specified count
      const shuffled = this.shuffleArray(allVoters);
      votersToMove = shuffled.slice(0, count);
    } else {
      // Move all voters (randomized order)
      votersToMove = this.shuffleArray(allVoters);
    }

    const actualCount = votersToMove.length;

    this.logger.log(
      `Moving ${actualCount} randomly selected registered voters from ${fromPollingUnitId} to ${toPollingUnitId}`,
    );

    // Get the maximum refIndex in the destination polling unit
    const maxRefIndexInDestination = await this.registeredModel
      .findOne({ pollingUnit: toPu })
      .sort({ refIndex: -1 })
      .select('refIndex')
      .exec();

    const startRefIndex = maxRefIndexInDestination
      ? maxRefIndexInDestination.refIndex + 1
      : 1;

    // Update the polling unit and refIndex for the voters being moved
    const voterIds = votersToMove.map((v) => v._id);
    const bulkOps = votersToMove.map((voter, index) => ({
      updateOne: {
        filter: { _id: voter._id },
        update: {
          pollingUnit: toPu._id,
          refIndex: startRefIndex + index,
        },
      },
    }));

    await this.registeredModel.bulkWrite(bulkOps);

    // Reindex the remaining voters in the source polling unit
    const remainingVoters = await this.registeredModel
      .find({ pollingUnit: fromPu })
      .sort({ refIndex: 1 })
      .exec();

    if (remainingVoters.length > 0) {
      const reindexOps = remainingVoters.map((voter, index) => ({
        updateOne: {
          filter: { _id: voter._id },
          update: { refIndex: index + 1 },
        },
      }));

      await this.registeredModel.bulkWrite(reindexOps);
    }

    // Update registeredCount for both polling units
    await Promise.all([
      this.pollingUnitModel.findByIdAndUpdate(fromPollingUnitId, {
        $inc: { registeredCount: -actualCount },
      }),
      this.pollingUnitModel.findByIdAndUpdate(toPollingUnitId, {
        $inc: { registeredCount: actualCount },
      }),
    ]);

    this.logger.log(
      `Successfully moved ${actualCount} registered voters and updated refIndex and registeredCount`,
    );
  }

  /**
   * Fisher-Yates shuffle algorithm to randomize array
   * @param array Array to shuffle
   * @returns Shuffled copy of the array
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  async bulkUploadFromFolder(
    wardId: string,
    files: Express.Multer.File[],
  ): Promise<{ 
    success: number; 
    failed: number; 
    errors: string[];
    pollingUnits: { pollingUnitId: string; code: string; dataCount: number }[];
  }> {
    this.logger.log(`Processing bulk upload for ward: ${wardId}`);
    
    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];
    const pollingUnits: { pollingUnitId: string; code: string; dataCount: number }[] = [];

    // Filter files that end with "_cleaned"
    const cleanedFiles = files.filter(file => {
      const nameWithoutExt = file.originalname.replace(/\.(csv|CSV)$/, '');
      return nameWithoutExt.endsWith('_cleaned');
    });

    this.logger.log(`Found ${cleanedFiles.length} cleaned CSV files to process`);

    for (const file of cleanedFiles) {
      try {
        // Extract filename without extension
        const nameWithoutExt = file.originalname.replace(/\.(csv|CSV)$/, '');
        
        // Remove "_cleaned" suffix
        const baseName = nameWithoutExt.replace(/_cleaned$/i, '');
        
        // Split by underscore to get code and name
        const parts = baseName.split('_');
        
        if (parts.length < 2) {
          errors.push(`Invalid filename format: ${file.originalname}. Expected format: CODE_NAME_cleaned.csv`);
          failedCount++;
          continue;
        }

        // First part is the code
        const code = parts[0];
        
        // Rest is the name (replace underscores with spaces, remove any remaining "_cleaned")
        let name = parts.slice(1).join(' ').replace(/_cleaned/gi, '').trim();

        this.logger.log(`Processing file: ${file.originalname} - Code: ${code}, Name: ${name}`);

        // Process CSV data first to get the count
        const data = await RegisteredHelper.processFileCsv(file);

        if (!data || data.length === 0) {
          errors.push(`No data found in file: ${file.originalname}`);
          failedCount++;
          continue;
        }

        const voterCount = data.length;

        // Create polling unit with voter counts
        const pollingUnit = await this.wardService.createPollingUnitByCodeAndName(
          wardId,
          code,
          name,
          voterCount,
          voterCount,
        );

        // Create registered voters
        const registeredVoters: Registered[] = data.map((row, i) => {
          const voter = new Registered();
          voter.name = row['NAME'];
          voter.id = row['ID'];
          voter.gender = row['GENDER'];
          voter.dob = row['DOB'];
          voter.pollingUnit = pollingUnit;
          voter.refIndex = i + 1;
          return voter;
        });

        // Insert voters
        await this.registeredModel.insertMany(registeredVoters);

        // Add to successful results
        pollingUnits.push({
          pollingUnitId: (pollingUnit as any)._id.toString(),
          code: code,
          dataCount: data.length,
        });

        this.logger.log(`Successfully uploaded ${data.length} voters for polling unit ${code} - ${name}`);
        successCount++;
      } catch (error) {
        this.logger.error(`Error processing file ${file.originalname}: ${error.message}`);
        errors.push(`${file.originalname}: ${error.message}`);
        failedCount++;
      }
    }

    this.logger.log(`Bulk upload completed. Success: ${successCount}, Failed: ${failedCount}`);
    
    return {
      success: successCount,
      failed: failedCount,
      errors,
      pollingUnits,
    };
  }
}

