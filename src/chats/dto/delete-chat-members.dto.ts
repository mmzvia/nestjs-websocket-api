import { IsArray, IsOptional, IsUUID } from 'class-validator';
import { HasUsers } from 'src/users/decorators';

export class DeleteChatMembersDto {
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  @HasUsers()
  members?: string[];
}
