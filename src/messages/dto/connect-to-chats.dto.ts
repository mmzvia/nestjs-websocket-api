import { IsArray, IsNotEmpty, IsUUID } from 'class-validator';
import { IsExistingChat } from 'src/chats/decorators';

export class ConnectToChatsDto {
  @IsNotEmpty()
  @IsArray()
  @IsUUID(4, { each: true })
  @IsExistingChat()
  chatIds: string[];
}
