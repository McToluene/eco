import {
    Body,
    Controller,
    Delete,
    Get,
    HttpStatus,
    Param,
    Post,
    Put,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserRequest, AssignPollingUnitsRequest, UpdateUserRequest } from './dtos/request/user-management.request';
import { UserResponse, UserListResponse } from './dtos/response/user-management.response';
import { BaseResponse } from '../dtos/response/base.response';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { UserType } from './enum/userType.enum';
import { HTTP_MESSAGES } from '../constants/messages.constants';
import { ResponseUtils } from '../utils/common.utils';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
    user: {
        userId: string;
        username: string;
        userType: UserType;
        assignedPollingUnits?: string[];
    };
}

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserType.ADMIN)
export class UserController {
    constructor(private readonly userService: UserService) { }

    @Post()
    async createUser(
        @Body() createUserDto: CreateUserRequest,
        @Req() req: AuthenticatedRequest,
    ): Promise<BaseResponse<UserResponse>> {
        const user = await this.userService.createUserByAdmin(createUserDto, req.user.userId);
        return ResponseUtils.createSuccessResponse(
            'User created successfully!',
            user,
            HttpStatus.CREATED
        );
    }

    @Get()
    async getAllUsers(
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10,
    ): Promise<BaseResponse<UserListResponse>> {
        const users = await this.userService.getAllUsers(page, limit);
        return ResponseUtils.createSuccessResponse(
            'Users fetched successfully!',
            users,
            HttpStatus.OK
        );
    }

    @Get(':id')
    async getUserById(@Param('id') id: string): Promise<BaseResponse<UserResponse>> {
        const user = await this.userService.findById(id);
        const userResponse = this.userService['formatUserResponse'](user); // Access private method via bracket notation
        return ResponseUtils.createSuccessResponse(
            'User fetched successfully!',
            userResponse,
            HttpStatus.OK
        );
    }

    @Put(':id')
    async updateUser(
        @Param('id') id: string,
        @Body() updateUserDto: UpdateUserRequest,
    ): Promise<BaseResponse<UserResponse>> {
        const user = await this.userService.updateUser(id, updateUserDto);
        return ResponseUtils.createSuccessResponse(
            'User updated successfully!',
            user,
            HttpStatus.OK
        );
    }

    @Put(':id/assign-polling-units')
    async assignPollingUnits(
        @Param('id') id: string,
        @Body() assignDto: AssignPollingUnitsRequest,
    ): Promise<BaseResponse<UserResponse>> {
        const user = await this.userService.assignPollingUnits(id, assignDto);
        return ResponseUtils.createSuccessResponse(
            'Polling units assigned successfully!',
            user,
            HttpStatus.OK
        );
    }

    @Delete(':id')
    async deleteUser(@Param('id') id: string): Promise<BaseResponse<void>> {
        await this.userService.deleteUser(id);
        return ResponseUtils.createSuccessResponse(
            'User deleted successfully!',
            null,
            HttpStatus.OK
        );
    }

    @Get('polling-unit/:pollingUnitId')
    async getUsersByPollingUnit(
        @Param('pollingUnitId') pollingUnitId: string,
    ): Promise<BaseResponse<UserResponse[]>> {
        const users = await this.userService.getUsersByPollingUnit(pollingUnitId);
        return ResponseUtils.createSuccessResponse(
            'Users fetched successfully!',
            users,
            HttpStatus.OK
        );
    }
}