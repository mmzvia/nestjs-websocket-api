import { Injectable } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { ChatsService } from 'src/chats/chats.service';
import { ConnectToChatsDto, CreateMessageDto, MessageDto } from './dto';
import { plainToInstance } from 'class-transformer';
import { WebSocketServer, WsException } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WsJwtAuthMiddleware } from 'src/auth/middlewares';

@Injectable()
export class MessagesFacade {
  constructor(
    private readonly wsJwtAuthMiddleware: WsJwtAuthMiddleware,
    private readonly chatsService: ChatsService,
    private readonly messagesService: MessagesService,
  ) {}

  initMiddlewares(server: Server) {
    server.use((socket, next) => this.wsJwtAuthMiddleware.use(socket, next));
  }

  async isChatsMember(userId: string, chatIds: string[]): Promise<boolean> {
    return await this.chatsService.isChatsMember(userId, chatIds);
  }

  async connectToChats(userId: string, dto: ConnectToChatsDto, client: Socket) {
    try {
      const { chatIds } = dto;
      const isMember = await this.isChatsMember(userId, chatIds);
      if (!isMember) {
        throw new Error('Forbidden');
      }
      chatIds.forEach((id) => client.join(id));
      client.emit('connectedToChats');
    } catch (error) {
      throw new WsException('Something went wrong');
    }
  }

  async createMessage(
    senderId: string,
    dto: CreateMessageDto,
    server: Server,
  ): Promise<void> {
    try {
      const { chatId } = dto;
      const isChatMember = await this.chatsService.isChatsMember(senderId, [
        chatId,
      ]);
      if (!isChatMember) {
        throw new Error('Forbidden');
      }
      const message = await this.messagesService.createMessage(senderId, dto);
      const messageDto = plainToInstance(MessageDto, message, {
        excludeExtraneousValues: true,
      });
      server.to(chatId).emit('newMessage', messageDto);
    } catch (error) {
      throw new WsException('Something went wrong');
    }
  }
}
