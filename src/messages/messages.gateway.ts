import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayInit,
} from '@nestjs/websockets';
import {
  ConnectToChatsDto,
  CreateMessageDto,
  FindMessagesDto,
  MessageDto,
} from './dto';
import { Server, Socket } from 'socket.io';
import { SerializeOptions, UsePipes } from '@nestjs/common';
import { User } from 'src/auth/decorators';
import { MessagesService } from './messages.service';
import { plainToInstance } from 'class-transformer';
import { WsJwtAuthMiddleware } from 'src/auth/middlewares';
import { WsValidationPipe } from './pipes';
import { WsUser } from 'src/auth/decorators/ws-user.decorator';
import { ChatsService } from 'src/chats/chats.service';

@WebSocketGateway()
@UsePipes(WsValidationPipe)
export class MessagesGateway implements OnGatewayInit, OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly wsJwtAuthMiddleware: WsJwtAuthMiddleware,
    private readonly chatsService: ChatsService,
    private readonly messagesService: MessagesService,
  ) {}

  afterInit(server: Server) {
    server.use((socket, next) => this.wsJwtAuthMiddleware.use(socket, next));
  }

  handleConnection() {
    console.log('CONNECTION');
  }

  @SubscribeMessage('connectToChats')
  async connectToChats(
    @WsUser('id') userId: string,
    @MessageBody() dto: ConnectToChatsDto,
    @ConnectedSocket() client: Socket,
  ): Promise<boolean> {
    const { chatIds } = dto;
    const isMember = await this.chatsService.isChatsMember(userId, chatIds);
    if (!isMember) {
      return false;
    }
    chatIds.forEach((id) => client.join(id));
    return true;
  }

  @SubscribeMessage('createMessage')
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
