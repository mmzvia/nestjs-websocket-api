import { Controller, Get, SerializeOptions, UseGuards } from '@nestjs/common';
import { JwtGuard } from 'src/auth/guards';
import { UsersService } from './users.service';
import { UserDto } from './dto';

@Controller('users')
@UseGuards(JwtGuard)
@SerializeOptions({ type: UserDto })
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async getUsers(): Promise<UserDto[]> {
    return this.usersService.getUsers();
  }
}
