import { Injectable } from '@nestjs/common';
import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
@ValidatorConstraint({ async: true })
export class IsExistingUsersConstraint implements ValidatorConstraintInterface {
  constructor(private readonly prismaService: PrismaService) {}

  async validate(userIds: string[]): Promise<boolean> {
    const userCount = userIds.length;
    if (userCount === 0) {
      return false;
    }
    const existingUserCount = await this.prismaService.user.count({
      where: { id: { in: userIds } },
    });
    return userCount === existingUserCount;
  }

  defaultMessage(args: ValidationArguments): string {
    const value = args.value;
    if (Array.isArray(value)) {
      return `Some user IDs do not exist: [${value.join(', ')}]`;
    }
    return `User ID "${value}" does not exist`;
  }
}
