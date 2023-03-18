import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class LoginRequest {
  @ApiProperty()
  username: string;

  @IsNotEmpty()
  @ApiProperty()
  @IsString()
  // @Matches(/^(?=.*[a-z])/, {
  //   message: 'Password must contain at least one lowercase character',
  // })
  // @Matches(/^(?=.*[A-Z])/, {
  //   message: 'Password must contain at least one uppecase character',
  // })
  // @Matches(/^(?=.*[0-9])/, {
  //   message: 'Password must contain at least one number',
  // })
  // @Matches(/^(?=.*[!@#%&*])/, {
  //   message: 'Password must contain at least one special character',
  // })
  password: string;
}
