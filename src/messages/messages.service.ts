import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateMessageDto, FindMessagesDto, MessageDto } from './dto';

@Injectable()
export class MessagesService {
  constructor(private readonly prismaService: PrismaService) {}
  async createMessage(
    senderId: string,
    createMessageDto: CreateMessageDto,
  ): Promise<MessageDto> {
    return this.prismaService.message.create({
      data: {
        chatId: createMessageDto.chatId,
        senderId,
        content: createMessageDto.content,
      },
      select: {
        chatId: true,
        senderId: true,
        content: true,
        createdAt: true,
      },
    });
  }

  async findMessages(dto: FindMessagesDto): Promise<MessageDto[]> {
    return this.prismaService.message.findMany({
      where: { chatId: dto.chatId },
      orderBy: { createdAt: 'desc' },
      take: dto.limit,
      skip: dto.offset,
      select: {
        chatId: true,
        senderId: true,
        content: true,
        createdAt: true,
      },
    });
  }
}
