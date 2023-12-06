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

  test('should reject if no access token is provided', async () => {
    //?Given: A registered user without providing an access token
    const registerResponse = await controller.register({
      email: 'fahad@gmail.com',
      password: '123123',
    });

    //?When: Making a request to refresh endpoint without an access token
    const refreshResponse = await request(app.getHttpServer())
      .post('/users/refresh')

      .send({ refreshToken: registerResponse.refreshToken });

    //?Then: The response should indicate the absence of an access token
    expect(refreshResponse.status).toBe(401);
    expect(refreshResponse.body.message).toContain('jwt must be provided');
  });

  test('should reject if no refresh token is provided', async () => {
    //?Given: A registered user without providing a refresh token
    const registerResponse = await controller.register({
      email: 'fahad@gmail.com',
      password: '123123',
    });

    //?When: Making a request to refresh endpoint without a refresh token
    const refreshResponse = await request(app.getHttpServer())
      .post('/users/refresh')

      .set('Authorization', `Bearer ${registerResponse.accessToken}`)
      .send({});

    //?Then: The response should indicate the absence of a refresh token
    expect(refreshResponse.status).toBe(401);
    expect(refreshResponse.body.message).toContain('jwt must be provided');
  });

  test('should reject if refresh token does not match user', async () => {
    //?Given: A registered user and a mismatched refresh token
    const registerResponse = await controller.register({
      email: 'fahad@gmail.com',
      password: '123123',
    });

    const registerResponse2 = await controller.register({
      email: 'fahad2@gmail.com',
      password: '123123',
    });

    const mismatchedRefreshToken = registerResponse2.refreshToken;

    //?When: Making a request to refresh endpoint with a mismatched refresh token
    const refreshResponse = await request(app.getHttpServer())
      .post('/users/refresh')
      .set('Authorization', `Bearer ${registerResponse.accessToken}`)

      .send({ refreshToken: mismatchedRefreshToken });

    //?Then: The response should indicate a mismatched token
    expect(refreshResponse.status).toBe(401);
    expect(refreshResponse.body.message).toContain(
      "You Don't Own The Refresh Token",
    );
  });

  test('should reject if refresh token is expired', async () => {
    //? Given: A registered user with an expired refresh token
    Date.now = jest.fn(() => new Date('2023-11-17T12:16:00Z').getTime());

    const registerResponse = await controller.register({
      email: 'fahad@gmail.com',
      password: '123123',
    });

    Date.now = jest.fn(() => new Date('2223-11-17T12:16:00Z').getTime());

    //? When: Making a request to refresh endpoint with an expired refresh toke
    const refreshResponse = await request(app.getHttpServer())
      .post('/users/refresh')
      .set('Authorization', `Bearer ${registerResponse.accessToken}`)

      .send({ refreshToken: registerResponse.refreshToken });

    //? Then: The response should indicate token expiration
    expect(refreshResponse.status).toBe(401);
    expect(refreshResponse.body.message).toContain('jwt expired');
  });
});
