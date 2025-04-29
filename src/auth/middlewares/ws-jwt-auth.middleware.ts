import { Injectable, NestMiddleware } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Socket } from 'socket.io';
import { JwtStrategy } from '../strategies';

@Injectable()
export class WsJwtAuthMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly jwtStrategy: JwtStrategy,
  ) {}

  async use(client: Socket, next) {
    try {
      const token = client.handshake.auth?.token;
      if (!token) {
        throw new Error();
      }
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });
      const user = await this.jwtStrategy.validate(payload);
      (client as any).user = user;
      next();
    } catch (err) {
      next(new Error('Unauthorized'));
    }
  }
}
