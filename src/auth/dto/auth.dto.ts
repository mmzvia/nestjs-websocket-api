import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class AuthDto {
  @IsEmail()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class RegisterResponseDto {
  username: string;
  createdAt: Date;
}

export class LoginResponseDto {
  access_token: string;
}
