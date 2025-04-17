import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, ValidationPipeOptions } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const vpOptitons: ValidationPipeOptions = {
    whitelist: true,
    forbidNonWhitelisted: true,
  };
  const vp = new ValidationPipe(vpOptitons);
  app.useGlobalPipes(vp);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
