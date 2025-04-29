import { Injectable } from '@nestjs/common';
import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
@ValidatorConstraint({ async: true })
export class HasChatsConstraint implements ValidatorConstraintInterface {
  constructor(private readonly prismaService: PrismaService) {}

  async validate(chatIds: string[]): Promise<boolean> {
    const chatCount = chatIds.length;
    if (chatCount === 0) {
      return false;
    }
    const existingChatCount = await this.prismaService.chat.count({
      where: { id: { in: chatIds } },
    });
    return chatCount === existingChatCount;
  }

  defaultMessage(args: ValidationArguments): string {
    const value = args.value;
    if (Array.isArray(value)) {
      return `Some chat IDs do not exist: [${value.join(', ')}]`;
    }
    return `Chat ID "${value}" does not exist`;
  }
}
