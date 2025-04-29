import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { HasUsersConstraint } from './validators';

@Module({
  controllers: [UsersController],
  providers: [UsersService, HasUsersConstraint],
  exports: [HasUsersConstraint],
})
export class UsersModule {}
