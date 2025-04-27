import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  ChatDto,
  ChatMemberDto,
  CreateChatDto,
  CreateChatMembersDto,
  CreateChatMembersResponseDto,
  DeleteChatMembersDto,
} from './dto';

@Injectable()
export class ChatsService {
  constructor(private readonly prismaService: PrismaService) {}

  async isChatsOwner(userId: string, chatIds: string[]): Promise<boolean> {
    const count = await this.prismaService.chat.count({
      where: {
        id: { in: chatIds },
        ownerId: userId,
      },
    });
    const isOwner = chatIds.length === count;
    return isOwner;
  }

  async isChatsMember(userId: string, chatIds: string[]): Promise<boolean> {
    const count = await this.prismaService.chatMember.count({
      where: {
        chatId: { in: chatIds },
        userId,
      },
    });
    return chatIds.length === count;
  }

  async createChat(
    ownerId: string,
    createChatDto: CreateChatDto,
  ): Promise<ChatDto> {
    const { name, members } = createChatDto;
    const createdChat = await this.prismaService.$transaction(async (tx) => {
      const chat = await tx.chat.create({
        data: {
          ownerId,
          name,
        },
        select: {
          id: true,
          name: true,
          createdAt: true,
        },
      });
      const ownerAndMembers = [ownerId, ...(members ?? [])];
      const data = Array.from(ownerAndMembers).map((userId) => ({
        chatId: chat.id,
        userId,
      }));
      await tx.chatMember.createMany({
        data,
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

  async getChatMembers(chatId: string): Promise<ChatMemberDto[]> {
    const members = await this.prismaService.chatMember.findMany({
      where: {
        chatId: chatId,
      },
      select: {
        userId: true,
        joinedAt: true,
        user: {
          select: {
            username: true,
          },
        },
      },
    });
    if (!members) {
    }
    const formattedMembers = members.map((member) => ({
      userId: member.userId,
      username: member.user.username,
      joinedAt: member.joinedAt,
    }));
    return formattedMembers;
  }

  async deleteChat(chatId: string): Promise<void> {
    await this.prismaService.$transaction([
      this.prismaService.chatMember.deleteMany({ where: { chatId } }),
      this.prismaService.chat.delete({ where: { id: chatId } }),
    ]);
  }

  async deleteChatMembers(
    chatId: string,
    deleteChatMembersDto: DeleteChatMembersDto,
  ): Promise<void> {
    const { members } = deleteChatMembersDto;
    const chat = await this.prismaService.chat.findUnique({
      where: { id: chatId },
      select: { ownerId: true },
    });
    const includesOwner = members!.includes(chat!.ownerId);
    if (includesOwner) {
      await this.deleteChat(chatId);
    } else {
      await this.prismaService.chatMember.deleteMany({
        where: {
          chatId,
          userId: {
            in: members,
          },
        },
      });
    }
  }
}
