import { Expose } from 'class-transformer';

export class ChatDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  createdAt: Date;

  constructor(partial: Partial<ChatDto>) {
    Object.assign(this, partial);
  }
}
