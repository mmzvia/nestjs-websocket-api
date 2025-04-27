import { registerDecorator, ValidationOptions } from 'class-validator';
import { IsExistingChatsConstraint } from '../validators';

export function IsExistingChats(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: IsExistingChatsConstraint,
    });
  };
}
