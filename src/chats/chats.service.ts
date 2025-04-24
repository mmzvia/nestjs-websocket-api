import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  ChatDto,
  ChatMemberDto,
  CreateChatDto,
  CreateChatMembersDto,
  CreateChatMembersResponseDto,
} from './dto';

@Injectable()
export class ChatsService {
  constructor(private readonly prismaService: PrismaService) {}

  async createChat(
    ownerId: string,
    createChatDto: CreateChatDto,
  ): Promise<ChatDto> {
    const createdChat = await this.prismaService.$transaction(async (tx) => {
      const chat = await tx.chat.create({
        data: {
          ownerId,
          name: createChatDto.name,
        },
      });
      const ownerAndMembers = new Set([
        ownerId,
        ...(createChatDto.members || []),
      ]);
      const membersData = Array.from(ownerAndMembers).map((userId) => ({
        chatId: chat.id,
        userId,
      }));
      await tx.chatMember.createMany({
        data: membersData,
        skipDuplicates: true,
      });
      return chat;
    });
    return createdChat;
  }

  async createChatMembers(
    chatId: string,
    dto: CreateChatMembersDto,
  ): Promise<CreateChatMembersResponseDto> {
    const result = await this.prismaService.chatMember.createMany({
      data: dto.members.map((userId) => ({ chatId, userId })),
      skipDuplicates: true,
    });
    const response: CreateChatMembersResponseDto = { count: result.count };
    return response;
  }

  async getChats(userId: string): Promise<ChatDto[]> {
    return this.prismaService.chat.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
      },
    });
  }

  async isChatOwner(chatId: string, userId: string): Promise<boolean> {
    const chat = await this.prismaService.chat.findUnique({
      where: { id: chatId },
      select: { ownerId: true },
    });
    const isOwner = chat?.ownerId == userId;
    return isOwner;
  }

  async isChatMember(chatId: string, userId: string): Promise<boolean> {
    return true;
  }
}
