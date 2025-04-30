import { Injectable } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { ChatsService } from 'src/chats/chats.service';
import {
  ConnectToChatsDto,
  CreateMessageDto,
  GetMessagesDto,
  MessageDto,
} from './dto';
import { plainToInstance } from 'class-transformer';
import { WsException } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WsJwtAuthMiddleware } from 'src/auth/middlewares';
import { Message } from '@prisma/client';

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

  async connectToChats(userId: string, dto: ConnectToChatsDto, client: Socket) {
    try {
      const { chatIds } = dto;
      const isMember = await this.chatsService.isChatsMember(userId, chatIds);
      if (!isMember) {
        throw new Error('Forbidden');
      }
      chatIds.forEach((id) => client.join(id));
      client.emit('chats:connect:success');
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
      const messageDto = this.messageToDto(message);
      server.to(chatId).emit('messages:new', messageDto);
    } catch (error) {
      throw new WsException('Something went wrong');
    }
  }

  async getMessages(
    userId: string,
    dto: GetMessagesDto,
    client: Socket,
  ): Promise<void> {
    try {
      const isMember = await this.chatsService.isChatsMember(userId, [
        dto.chatId,
      ]);
      if (!isMember) {
        throw new Error('Forbidden');
      }
      const messages = await this.messagesService.getMessages(dto);
      const messagesDto = this.messagesToDtos(messages);
      client.emit('messages:get:success', messagesDto);
    } catch (error) {
      throw new WsException('Something went wrong');
    }
  }

  private messageToDto(message: Partial<Message>): MessageDto {
    const dto = plainToInstance(MessageDto, message, {
      excludeExtraneousValues: true,
    });
    return dto;
  }

  private messagesToDtos(messages: Partial<Message>[]): MessageDto[] {
    const dtos = messages.map((message) => this.messageToDto(message));
    return dtos;
  }
}
