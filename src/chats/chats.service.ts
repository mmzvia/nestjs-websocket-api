import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ChatDto, CreateChatDto } from './dto';

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
}
