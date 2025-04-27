import { IsNotEmpty, IsNumber, IsUUID } from 'class-validator';

export class FindMessagesDto {
  @IsNotEmpty()
  @IsUUID(4)
  chatId: string;

  @IsNotEmpty()
  @IsNumber()
  limit: number;

  @IsNotEmpty()
  @IsNumber()
  offset: number;
}
