import { Expose } from 'class-transformer';

export class MessageDto {
  @Expose()
  chatId: string;

  @Expose()
  senderId: string;

  @Expose()
  content: string;

  @Expose()
  createdAt: Date;

  constructor(partial: Partial<MessageDto>) {
    Object.assign(this, partial);
  }
}
