import { registerDecorator, ValidationOptions } from 'class-validator';
import { IsExistingUserValidator } from '../validators/is-existing-user.validator';

export function IsExistingUser(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: IsExistingUserValidator,
    });
  };
}
