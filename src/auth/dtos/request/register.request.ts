import { IsNotEmpty, IsArray, IsMongoId, IsOptional } from 'class-validator';
import { LoginRequest } from './login.request';

export default class RegisterRequest extends LoginRequest {
  @IsArray()
  @IsOptional()
  @IsMongoId({ each: true })
  stateIds?: string[];
}
