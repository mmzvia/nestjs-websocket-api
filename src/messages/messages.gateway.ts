import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
} from '@nestjs/websockets';
import {
  ConnectToChatsDto,
  CreateMessageDto,
  FindMessagesDto,
  MessageDto,
} from './dto';
import { Server, Socket } from 'socket.io';
import { SerializeOptions, UseGuards } from '@nestjs/common';
import { WsJwtGuard } from 'src/auth/guards';
import { WsChatMemberGuard } from './guards/ws-chat-member.guard';
import { User } from 'src/auth/decorators';
import { MessagesService } from './messages.service';
import { plainToInstance } from 'class-transformer';

@WebSocketGateway()
@UseGuards(WsJwtGuard)
export class MessagesGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly messagesService: MessagesService) {}

  @SubscribeMessage('connectToChat')
  @UseGuards(WsChatMemberGuard)
  connectToChat(
    @MessageBody() dto: ConnectToChatsDto,
    @ConnectedSocket() client: Socket,
  ): void {
    dto.chatIds.forEach((id) => client.join(id));
    client.emit('connected', dto);
  }

  @SubscribeMessage('createMessage')
  @UseGuards(WsChatMemberGuard)
  @SerializeOptions({ type: MessageDto })
  async createMessage(
    @User('id') senderId: string,
    @MessageBody() dto: CreateMessageDto,
  ): Promise<void> {
    const message = await this.messagesService.createMessage(senderId, dto);
    const messageDto = plainToInstance(MessageDto, message, {
      excludeExtraneousValues: true,
    });
    this.server.to(dto.chatId).emit('newMessage', messageDto);
  }

  @SubscribeMessage('findMessages')
  @UseGuards(WsChatMemberGuard)
  @SerializeOptions({ type: MessageDto })
  async findMessages(
    @MessageBody() dto: FindMessagesDto,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const messages = await this.messagesService.findMessages(dto);
    const messagesDto = messages.map((message) =>
      plainToInstance(MessageDto, message, {
        excludeExtraneousValues: true,
      }),
    );
    client.emit('loadMessages', messagesDto);
  }
}
