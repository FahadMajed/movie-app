import { INestApplication } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from 'src/user/presentation/guards/jwt.guard';
import { UserController } from 'src/user/presentation/user.controller';
import { UserModule } from 'src/user/user.module';

import * as request from 'supertest';
import {
  cacheModule,
  configModule,
  ormModule,
} from 'test/configs/test.configs';

describe('Auth Service', () => {
  let controller: UserController;
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ormModule, configModule, cacheModule, UserModule],
      providers: [
        {
          provide: APP_GUARD,
          useClass: JwtAuthGuard,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    controller = app.get(UserController);
  });

  describe('/refresh (POST)', () => {
    test('should generate new access token with valid tokens', async () => {
      //? Given: A registered user with an a valid refresh token
      const registerResponse = await controller.register({
        email: 'fahad@gmail.com',
        password: '123123',
      });

      //? When: A refresh request occurs
      const refreshResponse = await request(app.getHttpServer())
        .post('/users/refresh')
        .set('Authorization', `Bearer ${registerResponse.accessToken}`)

        .send({ refreshToken: registerResponse.refreshToken });

      //? Then: A new Access token is provided
      expect(refreshResponse.body.accessToken).toBeDefined();
    });
  });
});
