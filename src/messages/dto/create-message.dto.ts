import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateMessageDto {
  @IsNotEmpty()
  @IsUUID(4)
  chatId: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(160)
  content: string;
}
