import {
  ClassSerializerInterceptor,
  ClassSerializerInterceptorOptions,
  HttpStatus,
  INestApplication,
  ValidationPipe,
  ValidationPipeOptions,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import * as pactum from 'pactum';
import { AuthDto } from 'src/auth/dto';

describe('App e2e test', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const testingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = testingModule.createNestApplication();

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

    pactum.request.setBaseUrl('http:/localhost:3333/');

    await app.init();
    await app.listen(3333);
  });

  afterAll(() => {
    app.close();
  });

  describe('auth', () => {
    const authDto: AuthDto = {
      username: 'test@test.com',
      password: 'test',
    };

    describe('POST register', () => {
      it('should register new user', () => {
        return pactum
          .spec()
          .post('auth/register')
          .withBody(authDto)
          .expectStatus(HttpStatus.CREATED);
      });

      it('should return forbidden when username taken', () => {
        return pactum
          .spec()
          .post('auth/register')
          .withBody(authDto)
          .expectStatus(HttpStatus.FORBIDDEN);
      });
    });

    describe('POST login', () => {
      it('should login', () => {
        return pactum
          .spec()
          .post('auth/login')
          .withBody(authDto)
          .expectStatus(HttpStatus.OK)
          .stores('access_token', 'access_token');
      });

      it('should return forbidden when password not valid', () => {
        return pactum
          .spec()
          .post('auth/login')
          .withBody({ username: 'test@test.com', password: 'invalid-password' })
          .expectStatus(HttpStatus.UNAUTHORIZED);
      });
    });
  });
});
