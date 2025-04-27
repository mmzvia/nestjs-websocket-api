import { IsArray, IsNotEmpty, IsUUID } from 'class-validator';
import { IsExistingUsers } from 'src/users/decorators';

export class CreateChatMembersDto {
  @IsNotEmpty()
  @IsArray()
  @IsUUID(4, { each: true })
  @IsExistingUsers()
  members: string[];
}

export class CreateChatMembersResponseDto {
  count: number;
}
