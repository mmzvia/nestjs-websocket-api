import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateMessageDto, GetMessagesDto, MessageDto } from './dto';

@Injectable()
export class MessagesService {
  constructor(private readonly prismaService: PrismaService) {}
  async createMessage(
    senderId: string,
    dto: CreateMessageDto,
  ): Promise<MessageDto> {
    const { chatId, content } = dto;
    return this.prismaService.message.create({
      data: {
        chatId,
        senderId,
        content,
      },
      select: {
        chatId: true,
        senderId: true,
        content: true,
        createdAt: true,
      },
    });
  }

  async getMessages(dto: GetMessagesDto): Promise<MessageDto[]> {
    const { chatId, take, skip } = dto;
    return this.prismaService.message.findMany({
      where: { chatId },
      orderBy: { createdAt: 'desc' },
      take,
      skip,
      select: {
        chatId: true,
        senderId: true,
        content: true,
        createdAt: true,
      },
    });
  }
}
