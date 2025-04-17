import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  ClassSerializerInterceptor,
  ClassSerializerInterceptorOptions,
  ValidationPipe,
  ValidationPipeOptions,
} from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const vpOptitons: ValidationPipeOptions = {
    whitelist: true,
    forbidNonWhitelisted: true,
  };
  const vp = new ValidationPipe(vpOptitons);
  app.useGlobalPipes(vp);

  const reflector = app.get(Reflector);
  const csiOptions: ClassSerializerInterceptorOptions = {
    excludeExtraneousValues: true,
  };
  const csi = new ClassSerializerInterceptor(reflector, csiOptions);
  app.useGlobalInterceptors(csi);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
