import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthUser } from '../types';

export const WsUser = createParamDecorator(
  (
    key: keyof AuthUser | undefined,
    ctx: ExecutionContext,
  ): AuthUser[keyof AuthUser] | AuthUser => {
    const client = ctx.switchToWs().getClient();
    const user = client.user;
    return key ? user?.[key] : user;
  },
);
