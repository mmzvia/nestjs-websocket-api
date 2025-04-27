import { registerDecorator, ValidationOptions } from 'class-validator';
import { IsExistingUsersConstraint } from '../validators';

export function IsExistingUsers(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: IsExistingUsersConstraint,
    });
  };
}
