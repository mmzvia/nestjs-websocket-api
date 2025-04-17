import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { IsExistingUserValidator } from './validators';

@Module({
  controllers: [UsersController],
  providers: [UsersService, IsExistingUserValidator],
  exports: [IsExistingUserValidator],
})
export class UsersModule {}
