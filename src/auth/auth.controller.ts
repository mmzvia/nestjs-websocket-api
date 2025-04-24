import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  SerializeOptions,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto, LoginResponseDto } from './dto';
import { LocalAuthGuard } from './guards';
import { User } from './decorators';
import { AuthUser } from './types';
import { UserDto } from 'src/users/dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @SerializeOptions({ type: UserDto })
  register(@Body() dto: AuthDto): Promise<UserDto> {
    return this.authService.register(dto);
  }

  @Post('login')
  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  login(@User() user: AuthUser): Promise<LoginResponseDto> {
    return this.authService.login(user);
  }
}
