import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { Model } from 'mongoose';
import { CreateUserRequest, AssignPollingUnitsRequest, UpdateUserRequest } from './dtos/request/user-management.request';
import { UserResponse, UserListResponse } from './dtos/response/user-management.response';
import { UserAlreadyExistsException, StateNotFoundException, PollingUnitNotFoundException } from '../exceptions/business.exceptions';
import { StateService } from '../state/state.service';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { PollingUnit, PollingUnitDocument } from '../ward/schemas/polling.schema';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(PollingUnit.name) private pollingUnitModel: Model<PollingUnitDocument>,
    private stateService: StateService,
    private configService: ConfigService,
  ) { }

  async findOne(userName: string): Promise<User | undefined> {
    this.logger.log('Finding user', userName);
    return this.userModel.findOne({ userName })
      .populate('states')
      .populate('assignedPollingUnits')
      .populate('createdBy', 'userName');
  }

  async findById(userId: string): Promise<User | undefined> {
    this.logger.log('Finding user by ID', userId);
    return this.userModel.findById(userId)
      .populate('states')
      .populate({
        path: 'assignedPollingUnits',
        populate: {
          path: 'ward',
          populate: {
            path: 'lga',
            populate: {
              path: 'state',
              model: 'State'
            }
          }
        }
      })
      .populate('createdBy', 'userName');
  }

  async create(userData: User): Promise<User> {
    this.logger.log('Creating user');
    const { ...result } = userData;
    const createdUser = new this.userModel(result);
    return await createdUser.save();
  }

  async createUserByAdmin(createUserDto: CreateUserRequest, adminUserId: string): Promise<UserResponse> {
    this.logger.log('Admin creating user');

    // Check if user already exists
    const existingUser = await this.userModel.findOne({ userName: createUserDto.userName });
    if (existingUser) {
      throw new UserAlreadyExistsException();
    }

    // Validate that either stateIds or assignedPollingUnits is provided
    if ((!createUserDto.stateIds || createUserDto.stateIds.length === 0) &&
      (!createUserDto.assignedPollingUnits || createUserDto.assignedPollingUnits.length === 0)) {
      throw new BadRequestException('Either stateIds or assignedPollingUnits must be provided');
    }

    let states = [];
    let assignedPollingUnits = [];

    // Validate states if provided
    if (createUserDto.stateIds?.length > 0) {
      // Remove duplicates
      const uniqueStateIds = [...new Set(createUserDto.stateIds)];

      states = await Promise.all(
        uniqueStateIds.map(stateId => this.stateService.find(stateId))
      );

      const invalidStates = states.filter(state => !state);
      if (invalidStates.length > 0) {
        throw new StateNotFoundException();
      }
    }

    // Validate polling units if provided
    if (createUserDto.assignedPollingUnits?.length > 0) {
      // Remove duplicates
      const uniquePollingUnitIds = [...new Set(createUserDto.assignedPollingUnits)];

      assignedPollingUnits = await this.pollingUnitModel.find({
        _id: { $in: uniquePollingUnitIds }
      })
        .populate({
          path: 'ward',
          populate: {
            path: 'lga',
            populate: {
              path: 'state',
              model: 'State'
            }
          }
        });

      if (assignedPollingUnits.length !== uniquePollingUnitIds.length) {
        throw new PollingUnitNotFoundException();
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(+this.configService.get<number>('SALT_ROUND'));
    const hashedPassword = await bcrypt.hash(createUserDto.password, salt);

    const userData: Partial<User> = {
      userName: createUserDto.userName,
      password: hashedPassword,
      states,
      userType: createUserDto.userType,
      assignedPollingUnits,
      createdBy: { _id: adminUserId } as any,
      createdAt: new Date(),
    };

    const createdUser = new this.userModel(userData);
    const savedUser = await createdUser.save();

    return this.formatUserResponse(await this.findById(savedUser._id.toString()));
  }

  async getAllUsers(page: number = 1, limit: number = 10): Promise<UserListResponse> {
    this.logger.log('Getting all users');

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.userModel.find()
        .populate('states')
        .populate({
          path: 'assignedPollingUnits',
          populate: {
            path: 'ward',
            populate: {
              path: 'lga',
              populate: {
                path: 'state',
                model: 'State'
              }
            }
          }
        })
        .populate('createdBy', 'userName')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      this.userModel.countDocuments()
    ]);

    return {
      users: users.map(user => this.formatUserResponse(user)),
      total,
      page,
      limit
    };
  }

  async updateUser(userId: string, updateUserDto: UpdateUserRequest): Promise<UserResponse> {
    this.logger.log('Updating user');

    const updateData: any = {};

    if (updateUserDto.userName) {
      // Check if username is already taken by another user
      const existingUser = await this.userModel.findOne({
        userName: updateUserDto.userName,
        _id: { $ne: userId }
      });
      if (existingUser) {
        throw new UserAlreadyExistsException();
      }
      updateData.userName = updateUserDto.userName;
    }

    if (updateUserDto.password) {
      const salt = await bcrypt.genSalt(+this.configService.get<number>('SALT_ROUND'));
      updateData.password = await bcrypt.hash(updateUserDto.password, salt);
    }

    if (updateUserDto.userType) {
      updateData.userType = updateUserDto.userType;
    }

    if (updateUserDto.assignedPollingUnits) {
      // Remove duplicates
      const uniquePollingUnitIds = [...new Set(updateUserDto.assignedPollingUnits)];

      // Validate polling units
      const pollingUnits = await this.pollingUnitModel.find({
        _id: { $in: uniquePollingUnitIds }
      });

      if (pollingUnits.length !== uniquePollingUnitIds.length) {
        throw new PollingUnitNotFoundException();
      }

      updateData.assignedPollingUnits = pollingUnits;
    }

    const updatedUser = await this.userModel.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    );

    return this.formatUserResponse(await this.findById(updatedUser._id.toString()));
  }

  async assignPollingUnits(userId: string, assignDto: AssignPollingUnitsRequest): Promise<UserResponse> {
    this.logger.log('Assigning polling units to user');

    // Remove duplicates
    const uniquePollingUnitIds = [...new Set(assignDto.pollingUnitIds)];

    // Validate polling units exist
    const pollingUnits = await this.pollingUnitModel.find({
      _id: { $in: uniquePollingUnitIds }
    });

    if (pollingUnits.length !== uniquePollingUnitIds.length) {
      throw new PollingUnitNotFoundException();
    }

    const updatedUser = await this.userModel.findByIdAndUpdate(
      userId,
      { assignedPollingUnits: pollingUnits },
      { new: true }
    );

    return this.formatUserResponse(await this.findById(updatedUser._id.toString()));
  }

  async deleteUser(userId: string): Promise<void> {
    this.logger.log('Deleting user');
    await this.userModel.findByIdAndDelete(userId);
  }

  async getUsersByPollingUnit(pollingUnitId: string): Promise<UserResponse[]> {
    this.logger.log('Getting users by polling unit');

    const users = await this.userModel.find({
      assignedPollingUnits: pollingUnitId
    })
      .populate('states')
      .populate({
        path: 'assignedPollingUnits',
        populate: {
          path: 'ward',
          populate: {
            path: 'lga',
            populate: {
              path: 'state',
              model: 'State'
            }
          }
        }
      })
      .populate('createdBy', 'userName');

    return users.map(user => this.formatUserResponse(user));
  }

  private formatUserResponse(user: User): UserResponse {
    // If user has assignedPollingUnits, derive states from them
    let derivedStates = [];
    if (user.assignedPollingUnits && user.assignedPollingUnits.length > 0) {
      const stateMap = new Map();
      user.assignedPollingUnits.forEach((unit: any) => {
        const state = unit.ward?.lga?.state;
        if (state && state._id) {
          const stateId = state._id.toString();
          if (!stateMap.has(stateId)) {
            stateMap.set(stateId, {
              _id: state._id,
              name: state.name,
              code: state.code,
            });
          }
        }
      });
      derivedStates = Array.from(stateMap.values());
    }

    // Use explicit states if available and no polling units, otherwise use derived states
    const statesToReturn = (user.assignedPollingUnits && user.assignedPollingUnits.length > 0)
      ? derivedStates
      : (user.states || []).map((state: any) => ({
        _id: state._id,
        name: state.name,
        code: state.code,
      }));

    return {
      _id: (user as any)._id,
      userName: user.userName,
      userType: user.userType,
      states: statesToReturn,
      assignedPollingUnits: (user.assignedPollingUnits || []).map((unit: any) => ({
        _id: unit._id,
        name: unit.name,
        code: unit.code,
        ward: {
          _id: unit.ward?._id,
          name: unit.ward?.name,
          code: unit.ward?.code,
        }
      })),
      createdAt: user.createdAt,
      createdBy: user.createdBy ? {
        _id: (user.createdBy as any)._id,
        userName: (user.createdBy as any).userName,
      } : undefined,
    };
  }
}
