import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
  WebSocketServer,
} from '@nestjs/websockets';
import { ChatsDto, CreateMessageDto, GetMessagesDto } from './dto';
import { Server, Socket } from 'socket.io';
import { UsePipes } from '@nestjs/common';
import { User } from 'src/auth/decorators';
import { WsValidationPipe } from './pipes';
import { WsUser } from 'src/auth/decorators/ws-user.decorator';
import { MessagesFacade } from './messages.facade';

@WebSocketGateway()
@UsePipes(WsValidationPipe)
export class MessagesGateway implements OnGatewayInit {
  @WebSocketServer()
  private readonly server: Server;

  constructor(private readonly messagesFacade: MessagesFacade) {}

  afterInit(server: Server) {
    this.messagesFacade.initMiddlewares(server);
  }

  @SubscribeMessage('chats:connect')
  async connectToChats(
    @WsUser('id') userId: string,
    @MessageBody() dto: ChatsDto,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    await this.messagesFacade.connectToChats(userId, dto, client);
  }

  @SubscribeMessage('chats:disconnect')
  async disconnectFromChats(
    @MessageBody() dto: ChatsDto,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    await this.messagesFacade.disconnectFromChats(dto, client);
  }

  @SubscribeMessage('messages:create')
  async createMessage(
    @User('id') senderId: string,
    @MessageBody() dto: CreateMessageDto,
  ): Promise<void> {
    await this.messagesFacade.createMessage(senderId, dto, this.server);
  }

  @SubscribeMessage('messages:get')
  async getMessages(
    @WsUser('id') userId: string,
    @MessageBody() dto: GetMessagesDto,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    await this.messagesFacade.getMessages(userId, dto, client);
  }
}
