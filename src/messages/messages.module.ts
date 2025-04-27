import { Module } from '@nestjs/common';
import { MessagesGateway } from './messages.gateway';
import { ChatsModule } from 'src/chats/chats.module';
import { WsChatMemberGuard } from './guards/ws-chat-member.guard';
import { MessagesService } from './messages.service';

@Module({
  imports: [ChatsModule],
  providers: [MessagesGateway, MessagesService, WsChatMemberGuard],
})
export class MessagesModule {}
