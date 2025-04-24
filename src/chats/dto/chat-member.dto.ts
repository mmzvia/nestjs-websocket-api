import { Expose } from 'class-transformer';

export class ChatMemberDto {
  @Expose()
  userId: string;

  @Expose()
  username: string;

  @Expose()
  joinedAt: Date;

  constructor(partial: Partial<ChatMemberDto>) {
    Object.assign(this, partial);
  }
}
