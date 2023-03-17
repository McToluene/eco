import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { Model } from 'mongoose';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findOne(email: string): Promise<User | undefined> {
    this.logger.log('Finding user', email);
    return this.userModel.findOne({ email }).populate('role');
  }

  async create(userData: User): Promise<User> {
    this.logger.log('Creating user');
    const { ...result } = userData;
    const createdUser = new this.userModel(result);
    return await createdUser.save();
  }
}
