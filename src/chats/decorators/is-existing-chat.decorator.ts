import { registerDecorator, ValidationOptions } from 'class-validator';
import { IsExistingChatConstraint } from '../validators';

export function IsExistingChat(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: IsExistingChatConstraint,
    });
  };
}
