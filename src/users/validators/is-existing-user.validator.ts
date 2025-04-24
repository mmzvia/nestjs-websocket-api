import { Injectable } from '@nestjs/common';
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
@ValidatorConstraint({ async: true })
export class IsExistingUserConstraint implements ValidatorConstraintInterface {
  constructor(private readonly prismaService: PrismaService) {}

  async validate(value: string | string[]): Promise<boolean> {
    if (!value || (Array.isArray(value) && value.length === 0)) {
      return false;
    }
    const ids = Array.isArray(value) ? value : [value];
    const count = await this.prismaService.user.count({
      where: { id: { in: ids } },
    });
    const isValid = count === ids.length;
    return isValid;
  }
}
