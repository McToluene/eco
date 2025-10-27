import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Registered } from './schemas/registered.schema';
import { Model } from 'mongoose';
import { PollingUnit } from '../ward/schemas/polling.schema';
import { RegisteredHelper } from './helpers/registered.helper';
import { UploadApiResponse, UploadApiErrorResponse, v2 } from 'cloudinary';
import { ConfigService } from '@nestjs/config';
import { PollingUnitNotFoundException, InsufficientRegisteredVotersException } from '../exceptions/business.exceptions';
import { StringUtils } from '../utils/common.utils';

@Injectable()
export class RegisteredService {
  private readonly logger = new Logger(RegisteredService.name);

  constructor(
    @InjectModel(Registered.name)
    private registeredModel: Model<Registered>,

    @InjectModel(PollingUnit.name)
    private pollingUnitModel: Model<PollingUnit>,
    config: ConfigService,
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

  async findRegisteredVoters(pollingUnitId: string): Promise<Registered[]> {
    const pu = await this.pollingUnitModel.findById(pollingUnitId).exec();
    if (!pu) throw new PollingUnitNotFoundException();

    return await this.registeredModel
      .find({ pollingUnit: pu })
      .sort({ refIndex: 1 })
      .exec();
  }

  async deleteRegistered(pollingUnitId: string): Promise<void> {
    const pu = await this.pollingUnitModel.findById(pollingUnitId).exec();
    if (!pu) throw new PollingUnitNotFoundException();

    await this.registeredModel.deleteMany({ pollingUnit: pu }).exec();
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
    const uploadedFiles = [];
    const pollingUnit = await this.pollingUnitModel
      .findById(pollingUnitId)
      .exec();
    if (!pollingUnit) throw new PollingUnitNotFoundException();

    for (const file of files) {
      if (file.originalname.includes('-')) {
        const splitedName = file.originalname.split('-');
        if (splitedName[1]) {
          const splitedNumber = splitedName[1].split('.');
          const result = await this.uploadFile(file);
          uploadedFiles.push({ refIndex: splitedNumber[0], result });
        }
      } else {
        const splitedNumber = file.originalname.split('.');
        const v = await this.registeredModel.findOne({
          refIndex: splitedNumber[0],
          pollingUnit,
        });

        if (v) {
          const result = await this.uploadFile(file);
          uploadedFiles.push({
            refIndex: splitedNumber[0],
            result,
          });
        }
      }
    }

    for (const up of uploadedFiles) {
      await this.registeredModel.findOneAndUpdate(
        {
          refIndex: up.refIndex,
          pollingUnit,
        },
        { imageUrl: up.result.url },
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
    count: number,
  ): Promise<void> {
    this.logger.log(
      `Moving ${count} registered voters from ${fromPollingUnitId} to ${toPollingUnitId}`,
    );

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
    const votersToMove = await this.registeredModel
      .find({ pollingUnit: fromPu })
      .sort({ refIndex: 1 })
      .limit(count)
      .exec();

    if (votersToMove.length < count) {
      throw new InsufficientRegisteredVotersException();
    }

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
        $inc: { registeredCount: -count },
      }),
      this.pollingUnitModel.findByIdAndUpdate(toPollingUnitId, {
        $inc: { registeredCount: count },
      }),
    ]);

    this.logger.log(
      `Successfully moved ${count} registered voters and updated refIndex and registeredCount`,
    );
  }
}
