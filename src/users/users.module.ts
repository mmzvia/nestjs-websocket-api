import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { IsExistingUsersConstraint } from './validators';

@Module({
  controllers: [UsersController],
  providers: [UsersService, IsExistingUsersConstraint],
  exports: [IsExistingUsersConstraint],
})
export class UsersModule {}
