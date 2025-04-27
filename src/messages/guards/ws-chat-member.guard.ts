import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ChatsService } from 'src/chats/chats.service';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class WsChatMemberGuard implements CanActivate {
  constructor(private readonly chatsService: ChatsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient();
    const data = context.switchToWs().getData();

    const userId = client.data?.userId;
    if (!userId) {
      throw new WsException('Unauthorized');
    }

    const chatIds = data?.chatIds;
    if (!chatIds) {
      throw new WsException('Chat IDs is required');
    }

    const isMember = await this.chatsService.isChatsMember(userId, chatIds);
    if (!isMember) {
      throw new WsException('Access to chat denied');
    }

    return true;
  }
}
