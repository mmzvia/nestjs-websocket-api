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
import { Reflector } from '@nestjs/core';
import { useContainer } from 'class-validator';
import { CreateChatDto } from 'src/chats/dto';

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
    useContainer(app.select(AppModule), { fallbackOnErrors: true });

    const reflector = app.get(Reflector);
    const csiOptions: ClassSerializerInterceptorOptions = {
      excludeExtraneousValues: true,
    };
    const csi = new ClassSerializerInterceptor(reflector, csiOptions);
    app.useGlobalInterceptors(csi);

    const prismaService = app.get(PrismaService);
    await prismaService.cleanDb();

    pactum.request.setBaseUrl('http://localhost:3333');

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
      it('should register new user', () =>
        pactum
          .spec()
          .post('/auth/register')
          .withBody(authDto)
          .expectStatus(HttpStatus.CREATED)
          .expectJson('username', authDto.username)
          .expectBodyContains('createdAt'));

      it('should return bad request when username is missing', () => {
        const { username, ...filteredDto } = authDto;
        return pactum
          .spec()
          .post('/auth/register')
          .withBody(filteredDto)
          .expectStatus(HttpStatus.BAD_REQUEST);
      });

      it('should return bad request when password is missing', () => {
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

      it('should return forbidden when username taken', () =>
        pactum
          .spec()
          .post('/auth/register')
          .withBody(authDto)
          .expectStatus(HttpStatus.FORBIDDEN));
    });

    describe('POST /login', () => {
      it('should login', () =>
        pactum
          .spec()
          .post('/auth/login')
          .withBody(authDto)
          .expectStatus(HttpStatus.OK)
          .expectBodyContains('access_token')
          .stores('access_token', 'access_token'));

      it('should return unauthorized when username is missing', () => {
        const { username, ...filteredDto } = authDto;
        return pactum
          .spec()
          .post('/auth/login')
          .withBody(filteredDto)
          .expectStatus(HttpStatus.UNAUTHORIZED);
      });

      it('should return unauthorized when password is missing', () => {
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

  describe('/users', () => {
    const userDtoSchema = {
      type: 'object',
      required: ['id', 'username', 'createdAt'],
      additionalProperties: false,
      properties: {
        id: { type: 'string', format: 'uuid' },
        username: { type: 'string' },
        createdAt: { type: 'string', format: 'date-time' },
      },
    };

    describe('GET', () => {
      it('should return all users', () => {
        const userDtoArraySchema = {
          type: 'array',
          items: userDtoSchema,
        };
        return pactum
          .spec()
          .get('/users')
          .withHeaders({
            Authorization: 'Bearer $S{access_token}',
          })
          .expectStatus(HttpStatus.OK)
          .expectJsonSchema(userDtoArraySchema);
      });

      it('should return unauthorized when auth header is missing', () => {
        return pactum
          .spec()
          .get('/users')
          .expectStatus(HttpStatus.UNAUTHORIZED);
      });
    });

    describe('GET /me', () => {
      it('should return current user information', () => {
        return pactum
          .spec()
          .get('/users/me')
          .withHeaders({
            Authorization: 'Bearer $S{access_token}',
          })
          .expectStatus(HttpStatus.OK)
          .expectJsonSchema(userDtoSchema);
      });

      it('should return unauthorized when auth header is missing', () => {
        return pactum
          .spec()
          .get('/users/me')
          .expectStatus(HttpStatus.UNAUTHORIZED);
      });
    });
  });

  describe('/chats', () => {
    describe('POST', () => {
      const createChatDto: CreateChatDto = {
        name: 'test',
      };

      it('should create new chat', () => {
        return pactum
          .spec()
          .post('/chats')
          .withHeaders({
            Authorization: 'Bearer $S{access_token}',
          })
          .withBody(createChatDto)
          .expectStatus(HttpStatus.CREATED)
          .expectJson('name', 'test');
      });

      it('should create new chat with members', () => {});

      it('should return forbidden when auth header is missing', () => {});

      it('should return bad request when chat name is missing', () => {});

      it('should return bad request when members array is empty', () => {
        const invalidDto = { ...createChatDto, members: [] };
        return pactum
          .spec()
          .post('/chats')
          .withHeaders({
            Authorization: 'Bearer $S{access_token}',
          })
          .withBody(invalidDto)
          .expectStatus(HttpStatus.BAD_REQUEST);
      });
    });

    describe('POST /:id/users', () => {
      it('should add users to specified chat', () => {});

      it('should return not found if chat not exist', () => {});

      it('should return forbidden when auth header is missing', () => {});

      it('should return bad request when users array is empty', () => {});
    });

    describe('GET', () => {
      it('should return chats of current user', () => {});

      it('should return forbidden when auth header is missing', () => {});
    });

    describe('GET /:id/users', () => {
      it('should return users for specified chat', () => {});

      it('should return not found if chat not exist', () => {});

      it('should return forbidden when auth header is missing', () => {});

      it('should return forbidden when user is not chat owner', () => {});

      it('should return forbidden when user is not chat member', () => {});
    });

    describe('DELETE /:id', () => {
      it('should delete specified chat', () => {});

      it('should return forbidden when auth header is missing', () => {});

      it('should return forbidden when user is not owner', () => {});

      it('should return not found when chat not exist', () => {});
    });

    describe('DELETE /:id/users/', () => {
      it('should delete all users from chat if members is empty', () => {});

      it('should delete specified users from chat', () => {});

      it('should return forbidden when auth header is missing', () => {});

      it('should return forbidden when user is not owner', () => {});

      it('should return not found when chat not exist', () => {});

      it('should return not found when user not a member', () => {});
    });

    describe('DELETE /:id/users/:usersId', () => {
      it('should delete specified user from chat', () => {});

      it('should return forbidden when auth header is missing', () => {});

      it('should return forbidden when user is not owner', () => {});

      it('should return not found when chat not exist', () => {});

      it('should return not found when user not a member', () => {});
    });
  });
});
