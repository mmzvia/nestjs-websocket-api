import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto, RegisterResponseDto, LoginResponseDto } from './dto';
import { LocalAuthGuard } from './guards';
import { User } from './decorators';
import { AuthUser } from './types';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() authDto: AuthDto): Promise<RegisterResponseDto> {
    return this.authService.register(authDto);
  }

  @Post('login')
  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  login(@User() user: AuthUser): Promise<LoginResponseDto> {
    return this.authService.login(user);
  }
}
