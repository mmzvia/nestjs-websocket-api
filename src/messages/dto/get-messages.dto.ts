import { IsNotEmpty, IsNumber, IsUUID } from 'class-validator';

export class GetMessagesDto {
  @IsNotEmpty()
  @IsUUID(4)
  chatId: string;

  @IsNotEmpty()
  @IsNumber()
  take: number;

  @IsNotEmpty()
  @IsNumber()
  skip: number;
}
