import { IsArray, IsNotEmpty, IsUUID } from 'class-validator';
import { HasUsers } from 'src/users/decorators';

export class CreateChatMembersDto {
  @IsNotEmpty()
  @IsArray()
  @IsUUID(4, { each: true })
  @HasUsers()
  members: string[];
}

export class CreateChatMembersResponseDto {
  count: number;
}
