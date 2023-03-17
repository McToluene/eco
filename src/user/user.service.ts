import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { Model } from 'mongoose';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findOne(userName: string): Promise<User | undefined> {
    this.logger.log('Finding user', userName);
    return this.userModel.findOne({ userName }).populate({
      path: 'lga',
      populate: {
        path: 'state',
        model: 'State',
      },
    });
  }

  async create(userData: User): Promise<User> {
    this.logger.log('Creating user');
    const { ...result } = userData;
    const createdUser = new this.userModel(result);
    return await createdUser.save();
  }
}
