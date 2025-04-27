import { AuthGuard } from '@nestjs/passport';

export class WsJwtAuthGuard extends AuthGuard('ws-jwt') {}
