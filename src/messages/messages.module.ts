import { Module } from '@nestjs/common';
import { MessagesGateway } from './messages.gateway';
import { ChatsModule } from 'src/chats/chats.module';
import { MessagesService } from './messages.service';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [ChatsModule, AuthModule],
  providers: [MessagesGateway, MessagesService],
})
export class MessagesModule {}
