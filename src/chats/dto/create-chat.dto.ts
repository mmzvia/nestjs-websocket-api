import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { IsExistingUser } from 'src/users/decorators';

export class CreateChatDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  @IsExistingUser()
  members?: string[];
}
