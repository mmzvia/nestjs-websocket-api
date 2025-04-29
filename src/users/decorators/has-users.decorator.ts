import { registerDecorator, ValidationOptions } from 'class-validator';
import { HasUsersConstraint } from '../validators';

export function HasUsers(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: HasUsersConstraint,
    });
  };
}
