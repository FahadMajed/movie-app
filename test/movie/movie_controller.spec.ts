import { Test, TestingModule } from '@nestjs/testing';

import {
  BadRequestException,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { MovieModule } from 'src/movie/movie.module';
import * as request from 'supertest';
import dropDatabase, {
  cacheModule,
  ormModule,
} from 'test/configs/test.configs';

describe('MoviesController', () => {
  let app: INestApplication;

  describe('Movie', () => {
    it('should throw BadRequestException for invalid title (empty)', async () => {
      const movieRequest = {
        title: '',
        timeSlots: [
          { startTime: new Date(), endTime: new Date(), capacity: 10 },
        ],
      };

      const response = await request(app.getHttpServer())
        .post('/movies')
        .send(movieRequest);

      expect(response.status).toBe(400);

      expect(response.body.message).toContain('title should not be empty');
    });

    it('should throw BadRequestException for invalid title (non-string)', async () => {
      const response = await request(app.getHttpServer())
        .post('/movies')
        .send({
          title: 123,
          timeSlots: [
            { startTime: new Date(), endTime: new Date(), capacity: 10 },
          ],
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('title must be a string');
    });
  });

  describe('Time Slots', () => {
    it('should throw BadRequestException for non-array timeSlots', async () => {
      const response = await request(app.getHttpServer()).post('/movies').send({
        title: 'Valid Title',
        timeSlots: 'invalid',
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('timeSlots must be an array');
    });

    it('should throw BadRequestException for empty timeSlots array', async () => {
      const response = await request(app.getHttpServer()).post('/movies').send({
        title: 'Valid Title',
        timeSlots: [],
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('timeSlots should not be empty');
    });

    it('should throw BadRequestException for invalid startTime format', async () => {
      const response = await request(app.getHttpServer())
        .post('/movies')
        .send({
          title: 'Valid Title',
          timeSlots: [
            { startTime: 'invalid-date', endTime: new Date(), capacity: 10 },
          ],
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('startTime must be a valid date');
    });

    it('should throw BadRequestException for invalid endTime format', async () => {
      const response = await request(app.getHttpServer())
        .post('/movies')
        .send({
          title: 'Valid Title',
          timeSlots: [
            { startTime: new Date(), endTime: 'invalid-date', capacity: 10 },
          ],
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('endTime must be a valid date');
    });

    it('should throw BadRequestException for startTime with seconds or milliseconds', async () => {
      const response = await request(app.getHttpServer())
        .post('/movies')
        .send({
          title: 'Valid Title',
          timeSlots: [
            {
              startTime: new Date('2023-01-01T10:00:10'),
              endTime: new Date(),
              capacity: 10,
            },
          ],
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain(
        'startTime must only include hours and minutes',
      );
    });

    it('should throw BadRequestException for endTime with seconds or milliseconds', async () => {
      const response = await request(app.getHttpServer())
        .post('/movies')
        .send({
          title: 'Valid Title',
          timeSlots: [
            {
              startTime: new Date(),
              endTime: new Date('2023-01-01T10:00:10'),
              capacity: 10,
            },
          ],
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain(
        'endTime must only include hours and minutes',
      );
    });

    it('should throw BadRequestException for endTime before startTime', async () => {
      const response = await request(app.getHttpServer())
        .post('/movies')
        .send({
          title: 'Valid Title',
          timeSlots: [
            {
              startTime: new Date('2023-01-01T12:00:00'),
              endTime: new Date('2023-01-01T11:00:00'),
              capacity: 10,
            },
          ],
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain(
        'endTime must be greater than startTime',
      );
    });

    it('should throw BadRequestException for invalid capacity', async () => {
      const response = await request(app.getHttpServer())
        .post('/movies')
        .send({
          title: 'Valid Title',
          timeSlots: [
            { startTime: new Date(), endTime: new Date(), capacity: 0 },
          ],
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain(
        'capacity must not be less than 1',
      );
    });
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ormModule, cacheModule, MovieModule],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        exceptionFactory: (validationErrors) => {
          function getConstraints(error) {
            if (error.children && error.children.length > 0) {
              return error.children.flatMap((childError) =>
                getConstraints(childError),
              );
            }
            return Object.values(error.constraints);
          }

          const errorMessages = validationErrors
            .flatMap((error) => getConstraints(error))
            .flat();

          return new BadRequestException({
            message:
              errorMessages.length > 0 ? errorMessages : ['Validation failed'],
          });
        },
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await dropDatabase(); // This will drop the database after each test
  });
});
