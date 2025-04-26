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
import { PrismaService } from 'src/prisma/prisma.service';
import { Reflector } from '@nestjs/core';
import { useContainer } from 'class-validator';
import { identity } from 'rxjs';
import { randomUUID } from 'crypto';

describe('App e2e test', () => {
  const ACCESS_TOKEN = '$S{access_token}';

  let app: INestApplication;
  let prismaService: PrismaService;

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
    useContainer(app.select(AppModule), { fallbackOnErrors: true });

    const reflector = app.get(Reflector);
    const csiOptions: ClassSerializerInterceptorOptions = {
      excludeExtraneousValues: true,
    };
    const csi = new ClassSerializerInterceptor(reflector, csiOptions);
    app.useGlobalInterceptors(csi);

    prismaService = app.get(PrismaService);

    pactum.request.setBaseUrl('http://localhost:3333');

    await app.init();
    await app.listen(3333);
  });

  beforeEach(async () => {
    await prismaService.cleanDb();
  });

  afterAll(() => {
    app.close();
  });

  describe('/auth', () => {
    describe('POST /register', () => {
      it('should register new user', () => {
        const authDto = {
          username: 'dummy@dummy.com',
          password: 'dummy',
        };
        const responseSchema = {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            username: { type: 'string', const: authDto.username },
            createdAt: { type: 'string', format: 'date-time' },
          },
          required: ['id', 'username', 'createdAt'],
        };
        return pactum
          .spec()
          .post('/auth/register')
          .withBody(authDto)
          .expectStatus(HttpStatus.CREATED)
          .expectJsonSchema(responseSchema);
      });

      it('should return bad request when username is missing', () => {
        const authDto = { password: 'dummy' };
        return pactum
          .spec()
          .post('/auth/register')
          .withBody(authDto)
          .expectStatus(HttpStatus.BAD_REQUEST);
      });

      it('should return bad request when password is missing', () => {
        const authDto = { username: 'dummy@dummy.com' };
        return pactum
          .spec()
          .post('/auth/register')
          .withBody(authDto)
          .expectStatus(HttpStatus.BAD_REQUEST);
      });

      it('should return bad request when body contains extra field', () => {
        const authDto = {
          username: 'dummy@dummy.com',
          password: 'dummy',
          extraField: 'dummy',
        };
        return pactum
          .spec()
          .post('/auth/register')
          .withBody(authDto)
          .expectStatus(HttpStatus.BAD_REQUEST);
      });

      it('should return forbidden when username is taken', async () => {
        const authDto = {
          username: 'dummy@dummy.com',
          password: 'dummy',
        };
        await pactum.spec().post('/auth/register').withBody(authDto);
        const duplicateAuthDto = {
          username: 'dummy@dummy.com',
          password: 'dummy',
        };
        return await pactum
          .spec()
          .post('/auth/register')
          .withBody(duplicateAuthDto)
          .expectStatus(HttpStatus.FORBIDDEN);
      });
    });

    describe('POST /login', () => {
      it('should login', async () => {
        const dto = {
          username: 'dummy@dummy.com',
          password: 'dummy',
        };
        await pactum.spec().post('/auth/register').withBody(dto);
        const responseSchema = {
          type: 'object',
          properties: {
            access_token: { type: 'string' },
          },
          required: ['access_token'],
        };
        return pactum
          .spec()
          .post('/auth/login')
          .withBody(dto)
          .expectStatus(HttpStatus.OK)
          .expectJsonSchema(responseSchema);
      });

      it('should return unauthorized when username is missing', () => {
        const dto = { password: 'dummy' };
        return pactum
          .spec()
          .post('/auth/login')
          .withBody(dto)
          .expectStatus(HttpStatus.UNAUTHORIZED);
      });

      it('should return unauthorized when password is missing', () => {
        const dto = { username: 'dummy@dummy.com' };
        return pactum
          .spec()
          .post('/auth/login')
          .withBody(dto)
          .expectStatus(HttpStatus.UNAUTHORIZED);
      });

      it('should return unauthorized when username is not valid', async () => {
        const dto = {
          username: 'dummy@dummy.com',
          password: 'dummy',
        };
        await pactum.spec().post('/auth/register').withBody(dto);
        const invalidDto = { username: 'invalid', password: 'dummy' };
        return pactum
          .spec()
          .post('/auth/login')
          .withBody(invalidDto)
          .expectStatus(HttpStatus.UNAUTHORIZED);
      });

      it('should return unauthorized when password not valid', async () => {
        const dto = {
          username: 'dummy@dummy.com',
          password: 'dummy',
        };
        await pactum.spec().post('/auth/register').withBody(dto);
        const invalidDto = { username: 'dummy', password: 'invalid' };
        return pactum
          .spec()
          .post('/auth/login')
          .withBody(invalidDto)
          .expectStatus(HttpStatus.UNAUTHORIZED);
      });
    });
  });

  describe('/users', () => {
    describe('GET', () => {
      it('should return all users', async () => {
        const authDto = {
          username: 'dummy@dummy.com',
          password: 'dummy',
        };
        await pactum.spec().post('/auth/register').withBody(authDto);
        await pactum
          .spec()
          .post('/auth/login')
          .withBody(authDto)
          .stores('access_token', 'access_token');
        const responseSchema = {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            properties: {
              id: { type: 'string', format: 'uuid' },
              username: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
            },
            required: ['id', 'username', 'createdAt'],
          },
        };
        return pactum
          .spec()
          .get('/users')
          .withBearerToken(ACCESS_TOKEN)
          .expectStatus(HttpStatus.OK)
          .expectJsonSchema(responseSchema);
      });

      it('should return unauthorized when auth header is missing', () => {
        return pactum
          .spec()
          .get('/users')
          .expectStatus(HttpStatus.UNAUTHORIZED);
      });
    });
  });

  describe('/chats', () => {
    beforeEach(async () => {
      const authDto = {
        username: 'owner@dummy.com',
        password: 'dummy',
      };
      await pactum
        .spec()
        .post('/auth/register')
        .withBody(authDto)
        .stores('ownerId', 'id');
      await pactum
        .spec()
        .post('/auth/login')
        .withBody(authDto)
        .stores('access_token', 'access_token');
    });

    describe('POST', () => {
      it('should create new chat', () => {
        const createChatDto = {
          name: 'dummy',
        };
        const responseSchema = {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string', const: createChatDto.name },
            createdAt: { type: 'string', format: 'date-time' },
          },
          required: ['id', 'name', 'createdAt'],
        };
        return pactum
          .spec()
          .post('/chats')
          .withBearerToken(ACCESS_TOKEN)
          .withBody(createChatDto)
          .expectStatus(HttpStatus.CREATED)
          .expectJsonSchema(responseSchema)
          .stores('chatId', 'id');
      });

      it('should create new chat with members', async () => {
        const authDto = {
          username: 'member@dummy.com',
          password: 'dummy',
        };
        await pactum
          .spec()
          .post('/auth/register')
          .withBody(authDto)
          .stores('memberId', 'id');
        const createChatDto = {
          name: 'dummy',
          members: ['$S{memberId}'],
        };
        const responseSchema = {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string', const: createChatDto.name },
            createdAt: { type: 'string', format: 'date-time' },
          },
          required: ['id', 'name', 'createdAt'],
        };
        return pactum
          .spec()
          .post('/chats')
          .withBearerToken(ACCESS_TOKEN)
          .withBody(createChatDto)
          .expectStatus(HttpStatus.CREATED)
          .expectJsonSchema(responseSchema);
      });

      it('should return unauthorized when auth header is missing', () => {
        return pactum
          .spec()
          .post('/chats')
          .expectStatus(HttpStatus.UNAUTHORIZED);
      });

      it('should return bad request when chat name is missing', () => {
        const createChatDto = {};
        return pactum
          .spec()
          .post('/chats')
          .withBearerToken(ACCESS_TOKEN)
          .withBody(createChatDto)
          .expectStatus(HttpStatus.BAD_REQUEST);
      });

      it('should return bad request when members array is defined but empty', () => {
        const createChatDto = { name: 'dummy', members: [] };
        return pactum
          .spec()
          .post('/chats')
          .withBearerToken(ACCESS_TOKEN)
          .withBody(createChatDto)
          .expectStatus(HttpStatus.BAD_REQUEST);
      });
    });

    describe('POST /:chatId/members', () => {
      beforeEach(async () => {
        const createChatDto = {
          name: 'dummy',
        };
        await pactum
          .spec()
          .post('/chats')
          .withBearerToken(ACCESS_TOKEN)
          .withBody(createChatDto)
          .stores('chatId', 'id');
      });

      it('should add users to specified chat', async () => {
        const memberAuthDto = {
          username: 'member@dummy.com',
          password: 'dummy',
        };
        await pactum
          .spec()
          .post('/auth/register')
          .withBody(memberAuthDto)
          .stores('memberId', 'id');

        const createChatMembersDto = {
          members: ['$S{memberId}'],
        };
        const responseSchema = {
          type: 'object',
          properties: {
            count: { type: 'number', const: 1 },
          },
          required: ['count'],
        };
        return pactum
          .spec()
          .post('/chats/$S{chatId}/members')
          .withBearerToken(ACCESS_TOKEN)
          .withBody(createChatMembersDto)
          .expectStatus(HttpStatus.CREATED)
          .expectJsonSchema(responseSchema);
      });

      it('should return unauthorized when auth header is missing', () => {
        return pactum
          .spec()
          .post('/chats/$S{chatId}/members')
          .expectStatus(HttpStatus.UNAUTHORIZED);
      });

      it('should return forbidden when user is not chat owner', async () => {
        const memberAuthDto = {
          username: 'member@dummy.com',
          password: 'dummy',
        };
        await pactum
          .spec()
          .post('/auth/register')
          .withBody(memberAuthDto)
          .stores('memberId', 'id');
        await pactum
          .spec()
          .post('/auth/login')
          .withBody(memberAuthDto)
          .stores('access_token', 'access_token');

        return pactum
          .spec()
          .post('/chats/$S{chatId}/members')
          .withBearerToken(ACCESS_TOKEN)
          .expectStatus(HttpStatus.FORBIDDEN);
      });

      it('should return bad request when members array is empty', () => {
        const createChatMembersDto = { members: [] };
        return pactum
          .spec()
          .post('/chats/$S{chatId}/members')
          .withBearerToken(ACCESS_TOKEN)
          .withBody(createChatMembersDto)
          .expectStatus(HttpStatus.BAD_REQUEST);
      });

      it('should return bad request when members field contains non-existing user', () => {
        const createChatMembersDto = {
          members: [randomUUID()],
        };
        return pactum
          .spec()
          .post('/chats/$S{chatId}/members')
          .withBearerToken(ACCESS_TOKEN)
          .withBody(createChatMembersDto)
          .expectStatus(HttpStatus.BAD_REQUEST);
      });
    });

    describe('GET', () => {
      it('should return chats of current user', async () => {
        const createChatDto = {
          name: 'dummy',
        };
        await pactum
          .spec()
          .post('/chats')
          .withBearerToken(ACCESS_TOKEN)
          .withBody(createChatDto)
          .stores('chatId', 'id');
        const responseSchema = {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              name: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
            },
            required: ['id', 'name', 'createdAt'],
          },
        };
        return pactum
          .spec()
          .get('/chats')
          .withBearerToken(ACCESS_TOKEN)
          .expectStatus(200)
          .expectJsonSchema(responseSchema);
      });

      it('should return unauthorized when auth header is missing', () => {
        return pactum
          .spec()
          .get('/chats')
          .expectStatus(HttpStatus.UNAUTHORIZED);
      });
    });

    describe('GET /:chatId/members', () => {
      it('should return members of specified chat', async () => {
        const authDto = {
          username: 'member@dummy.com',
          password: 'dummy',
        };
        await pactum
          .spec()
          .post('/auth/register')
          .withBody(authDto)
          .stores('memberId', 'id');
        const createChatDto = {
          name: 'dummy',
          members: ['$S{memberId}'],
        };
        await pactum
          .spec()
          .post('/chats')
          .withBearerToken(ACCESS_TOKEN)
          .withBody(createChatDto)
          .stores('chatId', 'id');
        const responseSchema = {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              username: { type: 'string', format: 'email' },
              joinedAt: { type: 'string', format: 'date-time' },
            },
          },
        };
        return pactum
          .spec()
          .get('/chats/$S{chatId}/members')
          .withBearerToken(ACCESS_TOKEN)
          .expectStatus(HttpStatus.OK)
          .expectJsonSchema(responseSchema);
      });

      it('should return unauthorized when auth header is missing', () => {
        return pactum
          .spec()
          .get('/chats/dummy/members')
          .withBearerToken(ACCESS_TOKEN)
          .expectStatus(HttpStatus.FORBIDDEN);
      });

      it('should return forbidden when user is not chat member', async () => {
        const createChatDto = {
          name: 'dummy',
        };
        await pactum
          .spec()
          .post('/chats')
          .withBearerToken(ACCESS_TOKEN)
          .withBody(createChatDto)
          .stores('chatId', 'id');
        const authDto = {
          username: 'member@dummy.com',
          password: 'dummy',
        };
        await pactum.spec().post('/auth/register').withBody(authDto);
        await pactum
          .spec()
          .post('/auth/login')
          .withBody(authDto)
          .stores('access_token', 'access_token');

        return pactum
          .spec()
          .get('/chats/$S{chatId}/members')
          .withBearerToken(ACCESS_TOKEN)
          .expectStatus(HttpStatus.FORBIDDEN);
      });
    });

    describe('DELETE /:chatId', () => {
      beforeEach(async () => {
        const createChatDto = {
          name: 'dummy',
        };
        await pactum
          .spec()
          .post('/chats')
          .withBearerToken(ACCESS_TOKEN)
          .withBody(createChatDto)
          .stores('chatId', 'id');
      });

      it('should delete specified chat', () => {
        return pactum
          .spec()
          .delete('/chats/$S{chatId}')
          .withBearerToken(ACCESS_TOKEN)
          .expectStatus(HttpStatus.NO_CONTENT);
      });

      it('should return unauthorized when auth header is missing', () => {
        return pactum
          .spec()
          .delete('/chats/$S{chatId}')
          .expectStatus(HttpStatus.UNAUTHORIZED);
      });

      it('should return forbidden when user is not chat owner', async () => {
        const authDto = {
          username: 'member@dummy.com',
          password: 'dummy',
        };
        await pactum
          .spec()
          .post('/auth/register')
          .withBody(authDto)
          .stores('memberId', 'id');

        const createChatMemberDto = {
          members: ['$S{memberId}'],
        };
        await pactum
          .spec()
          .post('/chats/$S{chatId}/members')
          .withBearerToken(ACCESS_TOKEN)
          .withBody(createChatMemberDto);

        await pactum
          .spec()
          .post('/auth/login')
          .withBody(authDto)
          .stores('access_token', 'access_token');

        return pactum
          .spec()
          .delete('/chats/$S{chatId}')
          .withBearerToken(ACCESS_TOKEN)
          .expectStatus(HttpStatus.FORBIDDEN);
      });
    });

    describe('DELETE /:chatId/members', () => {
      beforeEach(async () => {
        const authDto = {
          username: 'member@dummy.com',
          password: 'dummy',
        };
        await pactum
          .spec()
          .post('/auth/register')
          .withBody(authDto)
          .stores('memberId', 'id');

        const createChatDto = {
          name: 'dummy',
          members: ['$S{memberId}'],
        };
        await pactum
          .spec()
          .post('/chats')
          .withBearerToken(ACCESS_TOKEN)
          .withBody(createChatDto)
          .stores('chatId', 'id');
      });

      it('should delete specified members from chat', async () => {
        const deleteMembersDto = {
          members: ['$S{memberId}'],
        };
        return pactum
          .spec()
          .delete('/chats/$S{chatId}/members')
          .withBearerToken(ACCESS_TOKEN)
          .withBody(deleteMembersDto)
          .expectStatus(HttpStatus.NO_CONTENT);
      });

      it('should delete chat if owner is in members field', async () => {
        const deleteMembersDto = {
          members: ['$S{ownerId}'],
        };
        await pactum
          .spec()
          .delete('/chats/$S{chatId}/members')
          .withBearerToken(ACCESS_TOKEN)
          .withBody(deleteMembersDto)
          .expectStatus(HttpStatus.NO_CONTENT);

        return pactum
          .spec()
          .get('/chats')
          .withBearerToken(ACCESS_TOKEN)
          .expectJsonLength(0);
      });

      it('should return unauthorized when auth header is missing', () => {
        return pactum
          .spec()
          .delete('/chats/$S{chatId}/members')
          .expectStatus(HttpStatus.UNAUTHORIZED);
      });

      it('should return bad request when members field is empty', async () => {
        const deleteMembersDto = {
          members: [],
        };
        return pactum
          .spec()
          .delete('/chats/$S{chatId}/members')
          .withBearerToken(ACCESS_TOKEN)
          .withBody(deleteMembersDto)
          .expectStatus(HttpStatus.BAD_REQUEST);
      });

      it('should return forbidden when user is not owner', async () => {
        const authDto = {
          username: 'user@dummy.com',
          password: 'dummy',
        };
        await pactum.spec().post('/auth/register').withBody(authDto);
        await pactum
          .spec()
          .post('/auth/login')
          .withBody(authDto)
          .stores('access_token', 'access_token');

        return pactum
          .spec()
          .delete('/chats/$S{chatId}/members')
          .withBearerToken(ACCESS_TOKEN)
          .expectStatus(HttpStatus.FORBIDDEN);
      });
    });

    describe('DELETE /:chatId/members/me', () => {
      const memberAuthDto = {
        username: 'member@dummy.com',
        password: 'dummy',
      };

      beforeEach(async () => {
        await pactum
          .spec()
          .post('/auth/register')
          .withBody(memberAuthDto)
          .stores('memberId', 'id');

        const createChatDto = {
          name: 'dummy',
          members: ['$S{memberId}'],
        };
        await pactum
          .spec()
          .post('/chats')
          .withBearerToken(ACCESS_TOKEN)
          .withBody(createChatDto)
          .stores('chatId', 'id');
      });

      it('should delete current user from chat', async () => {
        await pactum
          .spec()
          .post('/auth/login')
          .withBody(memberAuthDto)
          .stores('access_token', 'access_token');

        return pactum
          .spec()
          .delete('/chats/$S{chatId}/members/me')
          .withBearerToken(ACCESS_TOKEN)
          .expectStatus(HttpStatus.NO_CONTENT);
      });

      it('should delete chat if user is owner', async () => {
        await pactum
          .spec()
          .delete('/chats/$S{chatId}/members/me')
          .withBearerToken(ACCESS_TOKEN)
          .expectStatus(HttpStatus.NO_CONTENT);

        return pactum
          .spec()
          .get('/chats')
          .withBearerToken(ACCESS_TOKEN)
          .expectJsonLength(0);
      });

      it('should return unauthorized when auth header is missing', () => {
        return pactum
          .spec()
          .delete('/chats/$S{chatId}/members/me')
          .expectStatus(HttpStatus.UNAUTHORIZED);
      });

      it('should return forbidden when user not chat member', async () => {
        const userAuthDto = {
          username: 'user@dummy.com',
          password: 'dummy',
        };
        await pactum.spec().post('/auth/register').withBody(userAuthDto);
        await pactum
          .spec()
          .post('/auth/login')
          .withBody(userAuthDto)
          .stores('access_token', 'access_token');

        return pactum
          .spec()
          .delete('/chats/$S{chatId}/members/me')
          .withBearerToken(ACCESS_TOKEN)
          .expectStatus(HttpStatus.FORBIDDEN);
      });
    });
  });
});
