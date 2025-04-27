import { Module } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { ChatsController } from './chats.controller';
import { UsersModule } from 'src/users/users.module';
import { ChatOwnerGuard, ChatMemberGuard } from './guards';
import { IsExistingChatConstraint } from './validators';

@Module({
  imports: [UsersModule],
  controllers: [ChatsController],
  providers: [
    ChatsService,
    ChatOwnerGuard,
    ChatMemberGuard,
    IsExistingChatConstraint,
  ],
  exports: [ChatsService, IsExistingChatConstraint],
})
export class ChatsModule {}
