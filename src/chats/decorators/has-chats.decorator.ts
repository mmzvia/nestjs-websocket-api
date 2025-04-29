import { registerDecorator, ValidationOptions } from 'class-validator';
import { HasChatsConstraint } from '../validators';

export function HasChats(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: HasChatsConstraint,
    });
  };
}
