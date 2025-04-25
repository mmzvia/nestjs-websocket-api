import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  SerializeOptions,
  UseGuards,
} from '@nestjs/common';
import { ChatsService } from './chats.service';
import { User } from 'src/auth/decorators';
import { JwtGuard } from 'src/auth/guards';
import {
  ChatDto,
  ChatMemberDto,
  CreateChatDto,
  CreateChatMembersDto,
  CreateChatMembersResponseDto,
  DeleteChatMembersDto,
} from './dto';
import { ChatOwnerGuard, ChatMemberGuard } from './guards';

@Controller('chats')
@UseGuards(JwtGuard)
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @Post()
  @SerializeOptions({ type: ChatDto })
  createChat(
    @User('id') ownerId: string,
    @Body() dto: CreateChatDto,
  ): Promise<ChatDto> {
    return this.chatsService.createChat(ownerId, dto);
  }

  @Post(':chatId/members')
  @UseGuards(ChatOwnerGuard)
  @HttpCode(HttpStatus.CREATED)
  createChatMember(
    @Param('chatId') chatId: string,
    @Body() dto: CreateChatMembersDto,
  ): Promise<CreateChatMembersResponseDto> {
    return this.chatsService.createChatMembers(chatId, dto);
  }

  @Get()
  @SerializeOptions({ type: ChatDto })
  getChats(@User('id') userId: string): Promise<ChatDto[]> {
    return this.chatsService.getChats(userId);
  }

  @Get(':chatId/members')
  @UseGuards(ChatMemberGuard)
  @SerializeOptions({ type: ChatMemberDto })
  getChat(@Param('chatId') chatId: string): Promise<ChatMemberDto[]> {
    return this.chatsService.getChatMembers(chatId);
  }

  @Delete(':chatId')
  @UseGuards(ChatOwnerGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteChat(@Param('chatId') chatId: string): Promise<void> {
    return this.chatsService.deleteChat(chatId);
  }

  @Delete(':chatId/members')
  @UseGuards(ChatOwnerGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteChatMembers(
    @Param('chatId') chatId: string,
    @Body() dto: DeleteChatMembersDto,
  ): Promise<void> {
    return this.chatsService.deleteChatMembers(chatId, dto);
  }

  @Delete(':chatId/members/me')
  @UseGuards(ChatMemberGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteCurrentUserFromChat(
    @Param('chatId') chatId: string,
    @User('id') userId: string,
  ): Promise<void> {
    const deleteChatMembersDto: DeleteChatMembersDto = {
      members: [userId],
    };
    return this.chatsService.deleteChatMembers(chatId, deleteChatMembersDto);
  }
}
