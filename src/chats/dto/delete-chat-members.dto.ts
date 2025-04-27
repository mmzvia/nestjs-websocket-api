import { IsArray, IsOptional, IsUUID } from 'class-validator';
import { IsExistingUsers } from 'src/users/decorators';

export class DeleteChatMembersDto {
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  @IsExistingUsers()
  members?: string[];
}
