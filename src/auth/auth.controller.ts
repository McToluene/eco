import {
  Body,
  Controller,
  HttpStatus,
  InternalServerErrorException,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import { LocalAuthGuard } from './guard/local-auth.guard';
import { AuthService } from './auth.service';
import { BaseResponse } from '../dtos/response/base.response';
import AuthResponse from './dtos/response/auth.response';
import { User } from 'src/user/schemas/user.schema';
import { ApiTags } from '@nestjs/swagger';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('/login')
  async login(@Req() req: Request): Promise<BaseResponse<AuthResponse>> {
    const response = this.authService.login(req.user as User);
    return {
      message: 'Logged in successfully!',
      data: response,
      status: HttpStatus.OK,
    };
  }

  @Post('/register')
  async registerUser(@Body() user: User): Promise<BaseResponse<AuthResponse>> {
    const createdUser = await this.authService.registerUser(user);
    if (!createdUser)
      throw new InternalServerErrorException('Failed to create user ');

    const response = this.authService.login(createdUser);
    return {
      message: 'User registered successfully!',
      data: response,
      status: HttpStatus.CREATED,
    };
  }
}
