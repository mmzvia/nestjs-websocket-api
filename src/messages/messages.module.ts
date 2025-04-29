import { Module } from '@nestjs/common';
import { MessagesGateway } from './messages.gateway';
import { ChatsModule } from 'src/chats/chats.module';
import { MessagesService } from './messages.service';
import { AuthModule } from 'src/auth/auth.module';
import { MessagesFacade } from './messages.facade';

@Module({
  imports: [ChatsModule, AuthModule],
  providers: [MessagesGateway, MessagesFacade, MessagesService],
})
export class MessagesModule {}
