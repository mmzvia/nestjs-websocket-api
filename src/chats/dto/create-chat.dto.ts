import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { IsExistingUsers } from 'src/users/decorators';

export class CreateChatDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  @IsExistingUsers()
  members?: string[];
}
