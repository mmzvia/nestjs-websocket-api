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

describe('App e2e test', () => {
  const authHeaders = {
    Authorization: 'Bearer $S{access_token}',
  };

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
        const dto = {
          username: 'dummy@dummy.com',
          password: 'dummy',
        };
        const responseSchema = {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            username: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
          required: ['id', 'username', 'createdAt'],
        };
        return pactum
          .spec()
          .post('/auth/register')
          .withBody(dto)
          .expectStatus(HttpStatus.CREATED)
          .expectJsonSchema(responseSchema);
      });

      it('should return bad request when username is missing', () => {
        const dto = { password: 'dummy' };
        return pactum
          .spec()
          .post('/auth/register')
          .withBody(dto)
          .expectStatus(HttpStatus.BAD_REQUEST);
      });

      it('should return bad request when password is missing', () => {
        const dto = { username: 'dummy@dummy.com' };
        return pactum
          .spec()
          .post('/auth/register')
          .withBody(dto)
          .expectStatus(HttpStatus.BAD_REQUEST);
      });

      it('should return bad request when body contains extra field', () => {
        const dto = {
          username: 'dummy@dummy.com',
          password: 'dummy',
          extraField: 'dummy',
        };
        return pactum
          .spec()
          .post('/auth/register')
          .withBody(dto)
          .expectStatus(HttpStatus.BAD_REQUEST);
      });

      it('should return forbidden when username is taken', async () => {
        const dto = {
          username: 'dummy@dummy.com',
          password: 'dummy',
        };
        await pactum.spec().post('/auth/register').withBody(dto);
        const duplicateDto = {
          username: 'dummy@dummy.com',
          password: 'dummy',
        };
        return await pactum
          .spec()
          .post('/auth/register')
          .withBody(duplicateDto)
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
        const dto = {
          username: 'dummy@dummy.com',
          password: 'dummy',
        };
        await pactum.spec().post('/auth/register').withBody(dto);
        await pactum
          .spec()
          .post('/auth/login')
          .withBody(dto)
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
          .withHeaders(authHeaders)
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

    describe('GET /me', () => {
      it('should return current user information', async () => {
        const dto = {
          username: 'dummy@dummy.com',
          password: 'dummy',
        };
        await pactum.spec().post('/auth/register').withBody(dto);
        await pactum
          .spec()
          .post('/auth/login')
          .withBody(dto)
          .stores('access_token', 'access_token');
        const responseSchema = {
          type: 'object',
          additionalProperties: false,
          properties: {
            id: { type: 'string', format: 'uuid' },
            username: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
          required: ['id', 'username', 'createdAt'],
        };
        return pactum
          .spec()
          .get('/users/me')
          .withHeaders(authHeaders)
          .expectStatus(HttpStatus.OK)
          .expectJsonSchema(responseSchema);
      });

      it('should return unauthorized when auth header is missing', () => {
        return pactum
          .spec()
          .get('/users/me')
          .expectStatus(HttpStatus.UNAUTHORIZED);
      });
    });
  });

  // describe('/chats', () => {
  //   beforeEach(async () => {
  //     await prismaService.cleanChats();
  //   });

  //   describe('POST', () => {
  //     it('should create new chat', () => {
  //       const dto: CreateChatDto = {
  //         name: 'dummy',
  //       };
  //       return pactum
  //         .spec()
  //         .post('/chats')
  //         .withHeaders(authHeaders)
  //         .withBody(dto)
  //         .expectStatus(HttpStatus.CREATED)
  //         .expectBodyContains('id')
  //         .stores('chatId', 'id')
  //         .expectJson('name', dto.name)
  //         .expectBodyContains('createdAt');
  //     });

  //     it('should create new chat with members', async () => {
  //       const authDto: AuthDto = {
  //         username: 'member@dummy.com',
  //         password: 'dummy',
  //       };
  //       await pactum
  //         .spec()
  //         .post('/auth/register')
  //         .withBody(authDto)
  //         .stores('memberId', 'id');
  //       const createChatDto: CreateChatDto = {
  //         name: 'dummy',
  //         members: ['$S{memberId}'],
  //       };
  //       return pactum
  //         .spec()
  //         .post('/chats')
  //         .withHeaders(authHeaders)
  //         .withBody(createChatDto)
  //         .expectStatus(HttpStatus.CREATED)
  //         .expectJson('name', createChatDto.name);
  //     });

  //     it('should return unauthorized when auth header is missing', () => {
  //       return pactum
  //         .spec()
  //         .post('/chats')
  //         .expectStatus(HttpStatus.UNAUTHORIZED);
  //     });

  //     it('should return bad request when chat name is missing', () => {
  //       return pactum
  //         .spec()
  //         .post('/chats')
  //         .withHeaders(authHeaders)
  //         .withBody({})
  //         .expectStatus(HttpStatus.BAD_REQUEST);
  //     });

  //     it('should return bad request when members array is defined but empty', () => {
  //       const dto = { name: 'dummy2', members: [] };
  //       return pactum
  //         .spec()
  //         .post('/chats')
  //         .withHeaders(authHeaders)
  //         .withBody(dto)
  //         .expectStatus(HttpStatus.BAD_REQUEST);
  //     });
  //   });

  //   describe('POST /:chatId/members', () => {
  //     beforeEach(async () => {
  //       const dto: CreateChatDto = {
  //         name: 'dummy',
  //       };
  //       await pactum
  //         .spec()
  //         .post('/chats')
  //         .withHeaders(authHeaders)
  //         .withBody(dto)
  //         .stores('chatId', 'id');
  //     });

  //     it('should add users to specified chat', () => {
  //       const dto: CreateChatMembersDto = {
  //         members: ['$S{memberId}'],
  //       };
  //       const responseDto: CreateChatMembersResponseDto = {
  //         count: 1,
  //       };
  //       return pactum
  //         .spec()
  //         .post('/chats/$S{chatId}/members')
  //         .withHeaders(authHeaders)
  //         .withBody(dto)
  //         .expectStatus(HttpStatus.CREATED)
  //         .expectJsonMatch(responseDto);
  //     });

  //     it('should return unauthorized when auth header is missing', () =>
  //       pactum
  //         .spec()
  //         .post('/chats/$S{chatId}/members')
  //         .expectStatus(HttpStatus.UNAUTHORIZED));

  //     it('should return forbidden if user tries to access not accessible chat', () =>
  //       pactum
  //         .spec()
  //         .post('/chats/dummy/members')
  //         .withHeaders(authHeaders)
  //         .expectStatus(HttpStatus.FORBIDDEN));

  //     it('should return bad request when users array is empty', () => {
  //       const dto: CreateChatMembersDto = { members: [] };
  //       return pactum
  //         .spec()
  //         .post('/chats/$S{chatId}/members')
  //         .withHeaders(authHeaders)
  //         .withBody(dto)
  //         .expectStatus(HttpStatus.BAD_REQUEST);
  //     });
  //   });

  //   describe('GET', () => {
  //     beforeEach(async () => {
  //       const dto: CreateChatDto = {
  //         name: 'dummy',
  //       };
  //       await pactum
  //         .spec()
  //         .post('/chats')
  //         .withHeaders(authHeaders)
  //         .withBody(dto)
  //         .stores('chatId', 'id');
  //     });

  //     it('should return chats of current user', () =>
  //       pactum
  //         .spec()
  //         .get('/chats')
  //         .withHeaders(authHeaders)
  //         .expectStatus(200)
  //         .expectJsonSchema({
  //           type: 'array',
  //           items: {
  //             type: 'object',
  //             properties: {
  //               id: { type: 'string', format: 'uuid' },
  //               name: { type: 'string' },
  //               createdAt: { type: 'string', format: 'date-time' },
  //             },
  //             required: ['id', 'name', 'createdAt'],
  //           },
  //         }));

  //     it('should return unauthorized when auth header is missing', () =>
  //       pactum.spec().get('/chats').expectStatus(HttpStatus.UNAUTHORIZED));
  //   });

  //   describe('GET /:chatId/members', () => {
  //     it('should return users for specified chat', async () => {
  //       const createChatDto: CreateChatDto = {
  //         name: 'dummy',
  //       };
  //       await pactum
  //         .spec()
  //         .post('/chats')
  //         .withHeaders(authHeaders)
  //         .withBody(createChatDto)
  //         .stores('chatId', 'id');

  //       const createChatMembersDto: CreateChatMembersDto = {
  //         members: ['$S{memberId}'],
  //       };
  //       await pactum
  //         .spec()
  //         .post('/chats/$S{chatId}/members')
  //         .withHeaders(authHeaders)
  //         .withBody(createChatMembersDto);

  //       return pactum
  //         .spec()
  //         .get('/&S{chatId}/members')
  //         .withHeaders(authHeaders);
  //     });

  //     it('should return not found if chat not exist', () => {});

  //     it('should return unauthorized when auth header is missing', () => {});

  //     it('should return forbidden when user is not chat member', () => {});
  //   });

  //   describe('DELETE /:chatId', () => {
  //     it('should delete specified chat', () => {});

  //     it('should return unauthorized when auth header is missing', () => {});

  //     it('should return forbidden when user is not owner', () => {});

  //     it('should return not found when chat not exist', () => {});
  //   });

  //   describe('DELETE /:chatId/members', () => {
  //     it('should delete all users from chat if members is empty', () => {});

  //     it('should delete specified users from chat', () => {});

  //     it('should return unauthorized when auth header is missing', () => {});

  //     it('should return forbidden when user is not owner', () => {});

  //     it('should return not found when chat not exist', () => {});

  //     it('should return not found when user not a member', () => {});
  //   });

  //   describe('DELETE /:chatId/members/me', () => {
  //     it('should delete current user from chat', () => {});

  //     it('should delete chat if user is owner', () => {});

  //     it('should return unauthorized when auth header is missing', () => {});

  //     it('should return not found when chat not exist', () => {});

  //     it('should return not found when user not chat member', () => {});
  //   });
  // });
});
