import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { IsExistingUserConstraint } from './validators';

@Module({
  controllers: [UsersController],
  providers: [UsersService, IsExistingUserConstraint],
  exports: [IsExistingUserConstraint],
})
export class UsersModule {}
