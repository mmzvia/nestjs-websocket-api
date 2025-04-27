import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ChatsService } from '../chats.service';

@Injectable()
export class ChatMemberGuard implements CanActivate {
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
    const isMember = await this.chatsService.isChatsMember(userId, [chatId]);
    if (!isMember) {
      throw new ForbiddenException();
    }
    return true;
  }
}
