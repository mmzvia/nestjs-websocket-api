import { Module } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { ChatsController } from './chats.controller';
import { UsersModule } from 'src/users/users.module';
import { ChatOwnerGuard, ChatMemberGuard } from './guards';
import { HasChatsConstraint } from './validators';

@Module({
  imports: [UsersModule],
  controllers: [ChatsController],
  providers: [
    ChatsService,
    ChatOwnerGuard,
    ChatMemberGuard,
    HasChatsConstraint,
  ],
  exports: [ChatsService, HasChatsConstraint],
})
export class ChatsModule {}
