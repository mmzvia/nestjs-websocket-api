import { AuthGuard } from '@nestjs/passport';

export class WsJwtGuard extends AuthGuard('ws-jwt') {}
