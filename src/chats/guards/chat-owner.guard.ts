import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ChatsService } from '../chats.service';

@Injectable()
export class ChatOwnerGuard implements CanActivate {
  constructor(private readonly chatsService: ChatsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;
    if (!userId) {
      throw new ForbiddenException();
    }
    const chatId = request.params?.chatId;
    if (!chatId) {
      throw new BadRequestException();
    }
    const isOwner = await this.chatsService.isChatsOwner(userId, [chatId]);
    if (!isOwner) {
      throw new ForbiddenException();
    }
    return true;
  }
}
