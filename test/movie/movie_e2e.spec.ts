import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { timestamp } from 'src/app/helpers/timestamp';
import { MovieRepository } from 'src/movie/data/repository/movie.repository';
import { MovieModule } from 'src/movie/movie.module';
import { MoviesController } from 'src/movie/presentation/movie.controller';
import * as request from 'supertest';
import dropDatabase, {
  cacheModule,
  configModule,
  ormModule,
} from 'test/configs/test.configs';
import { movieFactory } from './movie.factory';
describe('MoviesController E2E', () => {
  let app: INestApplication;
  let controller: MoviesController;
  let repository: MovieRepository;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ormModule, configModule, cacheModule, MovieModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    controller = app.get(MoviesController);
    repository = app.get(MovieRepository);
  });

  afterEach(async () => {
    await dropDatabase();
  });

  describe('/movies (POST)', () => {
    test('should create a new movie', async () => {
      const movieRequest = {
        title: 'Spider Man',
        timeSlots: [
          {
            startTime: new Date('2023-12-7 20:00'),
            endTime: new Date('2023-12-7 21:00'),
            capacity: 50,
          },
        ],
      };

      const response = await request(app.getHttpServer())
        .post('/movies')
        .send(movieRequest);

      expect(response.status).toBe(201);
      expect(response.body.movieId).toBeDefined();
      expect(response.body.timeSlotsIds).toHaveLength(1);
    });
  });

  describe('/reserve (POST)', () => {
    test('should successfully reserve a time slot', async () => {
      const movie = movieFactory();

      const createMovieResponse = await controller.createMovie(movie);

      const reserveResponse = await request(app.getHttpServer())
        .post(
          `/movies/${createMovieResponse.movieId}/timeSlots/${createMovieResponse.timeSlotsIds[0]}/reserve`,
        )
        .send({ numberOfPeople: movie.timeSlots[0].capacity });

      expect(reserveResponse.status).toBe(201);
    });

    test('should fail to reserve a time slot due to insufficient capacity', async () => {
      // Arrange: Create a movie with a time slot that has a full capacity
      const capacity = 50;
      const movie = movieFactory({
        timeSlots: [
          {
            id: timestamp(),
            capacity: capacity,
            bookedCount: 0, // Set the bookedCount to the full capacity
          } as any,
        ],
      });

      const createMovieResponse = await controller.createMovie(movie);
      //Reserve All
      await controller.reserveTimeSlot(
        createMovieResponse.movieId,
        createMovieResponse.timeSlotsIds[0],
        capacity,
      );

      // Act: Attempt to reserve one more seat than the available capacity
      const reserveResponse = await request(app.getHttpServer())
        .post(
          `/movies/${createMovieResponse.movieId}/timeSlots/${createMovieResponse.timeSlotsIds[0]}/reserve`,
        )
        .send({ numberOfPeople: 1 }); // T

      // Assert: Check that the reservation attempt failed due to insufficient capacity
      expect(reserveResponse.status).toBe(400);
      expect(reserveResponse.body.message).toContain(
        'Insufficient capacity for the requested number of seats.',
      );
    });

    test('should fail to reserve a time slot due to invalid movie ID', async () => {
      // Arrange: Use a non-existent or invalid movie ID (e.g., 'invalid_movie_id')
      const invalidMovieId = '65706d70b943e1ac6b92b94e';
      const timeSlotId = 1; // Use a valid time slot ID
      const numberOfPeople = 2; // Ensure there are enough seats

      // Act: Attempt to reserve a time slot with the invalid movie ID
      const reserveResponse = await request(app.getHttpServer())
        .post(`/movies/${invalidMovieId}/timeSlots/${timeSlotId}/reserve`)
        .send({ numberOfPeople: numberOfPeople });

      // Assert: Check that the reservation attempt failed due to the invalid movie ID
      expect(reserveResponse.status).toBe(404);
      expect(reserveResponse.body.message).toContain(
        `Movie with ID ${invalidMovieId} not found.`,
      );
    });

    test('should fail to reserve a time slot due to invalid time slot ID', async () => {
      // Arrange: Create a valid movie to have a valid movie ID
      const movie = movieFactory();
      const createMovieResponse = await controller.createMovie(movie);

      // Use a non-existent or invalid time slot ID (e.g., 999)
      const invalidTimeSlotId = 999;
      const numberOfPeople = 2; // Ensure there are enough seats

      // Act: Attempt to reserve a time slot with the invalid time slot ID
      const reserveResponse = await request(app.getHttpServer())
        .post(
          `/movies/${createMovieResponse.movieId}/timeSlots/${invalidTimeSlotId}/reserve`,
        )
        .send({ numberOfPeople: numberOfPeople });

      // Assert: Check that the reservation attempt failed due to the invalid time slot ID
      expect(reserveResponse.status).toBe(404);
      expect(reserveResponse.body.message).toContain(
        `Time slot with ID ${invalidTimeSlotId} not found in movie ${movie.title}.`,
      );
    });

    test('should successfully reserve time slots with valid sub-capacity requests', async () => {
      // Arrange: Create a valid movie to have a valid movie ID
      const movie = movieFactory();
      const createMovieResponse = await controller.createMovie(movie);

      // Get the time slot ID and capacity of the first time slot
      const timeSlotId = createMovieResponse.timeSlotsIds[0];
      const timeSlotCapacity = movie.timeSlots[0].capacity;

      // Divide the capacity into multiple sub-capacity requests
      const subCapacityRequests = [
        { numberOfPeople: Math.floor(timeSlotCapacity / 2) },
        { numberOfPeople: Math.ceil(timeSlotCapacity / 2) },
      ];

      let totalReservedSeats = 0;

      // Act: Attempt to reserve time slots with valid sub-capacity requests
      for (const requestParams of subCapacityRequests) {
        const reserveResponse = await request(app.getHttpServer())
          .post(
            `/movies/${createMovieResponse.movieId}/timeSlots/${timeSlotId}/reserve`,
          )
          .send(requestParams);

        // Assert: Check that each reservation attempt succeeds
        expect(reserveResponse.status).toBe(201);
        totalReservedSeats += requestParams.numberOfPeople;
      }

      //  Verify that the total bookedCount matches the sum of sub-capacity reservations
      const movieAfterReservations = await repository.findMovieById(
        createMovieResponse.movieId,
      );
      const reservedTimeSlot = movieAfterReservations.timeSlots.find(
        (slot) => slot.id === timeSlotId,
      );

      expect(reservedTimeSlot.bookedCount).toBe(totalReservedSeats);
    });

    test('should handle overlapping concurrent reservation attempts', async () => {
      // Arrange: Create a valid movie to have a valid movie ID
      const movie = movieFactory();
      const createMovieResponse = await controller.createMovie(movie);

      // Get the time slot ID and capacity of the first time slot
      const timeSlotId = createMovieResponse.timeSlotsIds[0];
      const timeSlotCapacity = movie.timeSlots[0].capacity;

      // Calculate the number of people to reserve just below and above the capacity limit
      const numberOfPeopleBelowCapacity = Math.floor(timeSlotCapacity / 2);
      const numberOfPeopleAboveCapacity = Math.ceil(timeSlotCapacity / 2) + 1;

      // Create two reservation requests
      const reservationRequests = [
        {
          numberOfPeople: numberOfPeopleBelowCapacity,
          requestId: 'request1', // Unique identifier for request 1
        },
        {
          numberOfPeople: numberOfPeopleAboveCapacity,
          requestId: 'request2', // Unique identifier for request 2
        },
      ];

      const reservationPromises = reservationRequests.map(
        async (requestParams) => {
          const reserveResponse = await request(app.getHttpServer())
            .post(
              `/movies/${createMovieResponse.movieId}/timeSlots/${timeSlotId}/reserve`,
            )
            .send(requestParams);

          return {
            requestId: requestParams.requestId,
            response: reserveResponse,
          };
        },
      );

      // Act: Simultaneously attempt overlapping reservations
      const reservationResults = await Promise.all(reservationPromises);

      // Assert: Check that one reservation attempt succeeded and the other failed due to capacity
      const successfulReservation = reservationResults.find(
        (result) => result.response.status === 201,
      );
      const failedReservation = reservationResults.find(
        (result) => result.response.status === 400,
      );

      expect(successfulReservation).toBeDefined();
      expect(failedReservation).toBeDefined();
      expect(successfulReservation.requestId).not.toBe(
        failedReservation.requestId,
      );
      expect(failedReservation.response.body.message).toContain(
        'Insufficient capacity for the requested number of seats.',
      );
    });
  });
});
