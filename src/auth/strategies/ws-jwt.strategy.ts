import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { WsException } from '@nestjs/websockets';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { AuthUser, JwtPayload } from '../types';

@Injectable()
export class WsJwtStrategy extends PassportStrategy(Strategy, 'ws-jwt') {
  constructor(
    private readonly prismaService: PrismaService,
    configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (client) => {
          return client?.handshake?.auth?.token;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET')!,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    const user = await this.prismaService.user.findUnique({
      where: {
        id: payload.sub,
      },
    });
    if (!user) {
      throw new WsException('User not found');
    }
    const authUser: AuthUser = { id: user.id };
    return authUser;
  }
}
