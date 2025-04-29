import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
  WebSocketServer,
} from '@nestjs/websockets';
import { ConnectToChatsDto, CreateMessageDto, MessageDto } from './dto';
import { Server, Socket } from 'socket.io';
import { SerializeOptions, UsePipes } from '@nestjs/common';
import { User } from 'src/auth/decorators';
import { WsValidationPipe } from './pipes';
import { WsUser } from 'src/auth/decorators/ws-user.decorator';
import { MessagesFacade } from './messages.facade';

@WebSocketGateway()
@UsePipes(WsValidationPipe)
export class MessagesGateway implements OnGatewayInit {
  @WebSocketServer()
  server: Server;

  constructor(private readonly messagesFacade: MessagesFacade) {}

  afterInit(server: Server) {
    this.messagesFacade.initMiddlewares(server);
  }

  @SubscribeMessage('connectToChats')
  async connectToChats(
    @WsUser('id') userId: string,
    @MessageBody() dto: ConnectToChatsDto,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    await this.messagesFacade.connectToChats(userId, dto, client);
  }

  @SubscribeMessage('createMessage')
  @SerializeOptions({ type: MessageDto })
  async createMessage(
    @User('id') senderId: string,
    @MessageBody() dto: CreateMessageDto,
  ): Promise<void> {
    await this.messagesFacade.createMessage(senderId, dto, this.server);
  }

  // @SubscribeMessage('findMessages')
  // @SerializeOptions({ type: MessageDto })
  // async findMessages(
  //   @MessageBody() dto: FindMessagesDto,
  //   @ConnectedSocket() client: Socket,
  // ): Promise<void> {
  //   const messages = await this.messagesService.findMessages(dto);
  //   const messagesDto = messages.map((message) =>
  //     plainToInstance(MessageDto, message, {
  //       excludeExtraneousValues: true,
  //     }),
  //   );
  //   client.emit('loadMessages', messagesDto);
  // }
}
