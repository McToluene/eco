import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Registered } from './schemas/registered.schema';
import { Model } from 'mongoose';
import { PollingUnit } from '../ward/schemas/polling.schema';
import { RegisteredHelper } from './helpers/registered.helper';
import { UploadApiResponse, UploadApiErrorResponse, v2 } from 'cloudinary';
import { ConfigService } from '@nestjs/config';

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
    if (!pu) throw new NotFoundException('Polling Unit not found!');
    const fileExtension = file.originalname.split('.').pop();
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

    this.registeredModel.insertMany(registeredVoters);
  }

  async findRegisteredVoters(pollingUnitId: string): Promise<Registered[]> {
    const pu = await this.pollingUnitModel.findById(pollingUnitId).exec();
    if (!pu) throw new NotFoundException('Polling Unit not found!');

    return await this.registeredModel
      .find({ pollingUnit: pu })
      .sort({ refIndex: 1 })
      .exec();
  }

  async deleteRegistered(pollingUnitId: string): Promise<void> {
    const pu = await this.pollingUnitModel.findById(pollingUnitId).exec();
    if (!pu) throw new NotFoundException('Polling Unit not found!');

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
    if (!pollingUnit) throw new NotFoundException('Polling Unit not found!');

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
}
