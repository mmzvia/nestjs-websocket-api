import { IsArray, IsNotEmpty, IsUUID } from 'class-validator';
import { IsExistingChats } from 'src/chats/decorators';

export class ConnectToChatsDto {
  @IsNotEmpty()
  @IsArray()
  @IsUUID(4, { each: true })
  @IsExistingChats()
  chatIds: string[];
}
