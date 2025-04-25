import { IsArray, IsOptional, IsUUID } from 'class-validator';
import { IsExistingUser } from 'src/users/decorators';

export class DeleteChatMembersDto {
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  @IsExistingUser()
  members?: string[];
}
