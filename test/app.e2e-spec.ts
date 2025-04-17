import {
  ClassSerializerInterceptor,
  ClassSerializerInterceptorOptions,
  HttpStatus,
  INestApplication,
  ValidationPipe,
  ValidationPipeOptions,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import * as pactum from 'pactum';
import { AuthDto } from 'src/auth/dto';
import { PrismaService } from 'src/prisma/prisma.service';

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

    const prismaService = app.get(PrismaService);
    await prismaService.cleanDb();

    pactum.request.setBaseUrl('http:/localhost:3333');

    await app.init();
    await app.listen(3333);
  });

  afterAll(() => {
    app.close();
  });

  describe('/auth', () => {
    const authDto: AuthDto = {
      username: 'test@test.com',
      password: 'test',
    };

    describe('POST /register', () => {
      it('should register new user', () => {
        return pactum
          .spec()
          .post('/auth/register')
          .withBody(authDto)
          .expectStatus(HttpStatus.CREATED)
          .expectJson('username', authDto.username)
          .expectBodyContains('createdAt');
      });

      it('should return bad request when username missing', () => {
        const { username, ...filteredDto } = authDto;
        return pactum
          .spec()
          .post('/auth/register')
          .withBody(filteredDto)
          .expectStatus(HttpStatus.BAD_REQUEST);
      });

      it('should return bad request when password missing', () => {
        const { password, ...filteredDto } = authDto;
        return pactum
          .spec()
          .post('/auth/register')
          .withBody(filteredDto)
          .expectStatus(HttpStatus.BAD_REQUEST);
      });

      it('should return bad request when body contains extra field', () => {
        const extendedDto = { ...authDto, extraField: 'test' };
        return pactum
          .spec()
          .post('/auth/register')
          .withBody(extendedDto)
          .expectStatus(HttpStatus.BAD_REQUEST);
      });

      it('should return forbidden when username taken', () => {
        return pactum
          .spec()
          .post('/auth/register')
          .withBody(authDto)
          .expectStatus(HttpStatus.FORBIDDEN);
      });
    });

    describe('POST /login', () => {
      it('should login', () => {
        return pactum
          .spec()
          .post('/auth/login')
          .withBody(authDto)
          .expectStatus(HttpStatus.OK)
          .expectBodyContains('access_token')
          .stores('access_token', 'access_token');
      });

      it('should return unauthorized when username missing', () => {
        const { username, ...filteredDto } = authDto;
        return pactum
          .spec()
          .post('/auth/login')
          .withBody(filteredDto)
          .expectStatus(HttpStatus.UNAUTHORIZED);
      });

      it('should return unauthorized when password missing', () => {
        const { password, ...filteredDto } = authDto;
        return pactum
          .spec()
          .post('/auth/login')
          .withBody(filteredDto)
          .expectStatus(HttpStatus.UNAUTHORIZED);
      });

      it('should return unauthorized when username not valid', () => {
        const invalidDto = { ...authDto, username: 'dummy' };
        return pactum
          .spec()
          .post('/auth/login')
          .withBody(invalidDto)
          .expectStatus(HttpStatus.UNAUTHORIZED);
      });

      it('should return unauthorized when password not valid', () => {
        const invalidDto = { ...authDto, password: 'dummy' };
        return pactum
          .spec()
          .post('/auth/login')
          .withBody(invalidDto)
          .expectStatus(HttpStatus.UNAUTHORIZED);
      });
    });
  });
});
