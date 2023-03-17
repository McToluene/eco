import { IsEmail, IsNotEmpty, IsString, Matches } from 'class-validator';

export class LoginRequest {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^(?=.*[a-z])/, {
    message: 'Password must contain at least one lowercase character',
  })
  @Matches(/^(?=.*[A-Z])/, {
    message: 'Password must contain at least one uppecase character',
  })
  @Matches(/^(?=.*[0-9])/, {
    message: 'Password must contain at least one number',
  })
  @Matches(/^(?=.*[!@#%&*])/, {
    message: 'Password must contain at least one special character',
  })
  password: string;
}
