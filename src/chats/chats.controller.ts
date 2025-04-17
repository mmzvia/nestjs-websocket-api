import {
  Body,
  Controller,
  Post,
  SerializeOptions,
  UseGuards,
} from '@nestjs/common';
import { ChatsService } from './chats.service';
import { User } from 'src/auth/decorators';
import { JwtGuard } from 'src/auth/guards';
import { ChatDto, CreateChatDto } from './dto';

@Controller('chats')
@UseGuards(JwtGuard)
@SerializeOptions({ type: ChatDto })
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @Post()
  createChat(
    @User('id') ownerId: string,
    @Body() createChatDto: CreateChatDto,
  ): Promise<ChatDto> {
    return this.chatsService.createChat(ownerId, createChatDto);
  }
}
