import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor(configService: ConfigService) {
    super({
      datasources: {
        db: {
          url: configService.get<string>('DATABASE_URL'),
        },
      },
    });
  }

  async cleanDb(): Promise<void> {
    await this.$transaction([
      this.message.deleteMany(),
      this.chatMember.deleteMany(),
      this.chat.deleteMany(),
      this.user.deleteMany(),
    ]);
  }
}
