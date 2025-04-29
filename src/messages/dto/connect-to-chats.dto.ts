import { IsArray, IsNotEmpty, IsUUID } from 'class-validator';
import { HasChats } from 'src/chats/decorators';

export class ConnectToChatsDto {
  @IsNotEmpty()
  @IsArray()
  @IsUUID(4, { each: true })
  @HasChats()
  chatIds: string[];
}
