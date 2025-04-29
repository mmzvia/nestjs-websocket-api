import { Injectable } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class WsValidationPipe extends ValidationPipe {
  constructor() {
    super({
      exceptionFactory: (errors) => new WsException(errors),
      whitelist: true,
      forbidNonWhitelisted: true,
    });
  }
}
