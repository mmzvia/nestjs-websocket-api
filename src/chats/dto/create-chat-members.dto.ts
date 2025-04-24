import { IsArray, IsNotEmpty, IsUUID } from 'class-validator';
import { IsExistingUser } from 'src/users/decorators';

export class CreateChatMembersDto {
  @IsNotEmpty()
  @IsArray()
  @IsUUID(4, { each: true })
  @IsExistingUser()
  members: string[];
}

export class CreateChatMembersResponseDto {
  count: number;
}
