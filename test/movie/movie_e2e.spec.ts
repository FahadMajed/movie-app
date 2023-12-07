import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { timestamp } from 'src/app/helpers/timestamp';
import { MovieRepository } from 'src/movie/data/repository/movie.repository';
import { MovieService } from 'src/movie/domain/services/movie.service';
import { MovieModule } from 'src/movie/movie.module';
import { MoviesController } from 'src/movie/presentation/movie.controller';
import * as request from 'supertest';
import dropDatabase, {
  cacheModule,
  configModule,
  ormModule,
} from 'test/configs/test.configs';
import { movieFactory } from './movie.factory';
describe('Movies E2E', () => {
  let app: INestApplication;
  let controller: MoviesController;
  let repository: MovieRepository;
  let service: MovieService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ormModule, configModule, cacheModule, MovieModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    controller = app.get(MoviesController);
    repository = app.get(MovieRepository);
    service = app.get(MovieService);
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

  describe('/capacity (GET)', () => {
    const createMovieAndReserveTimeSlot = async () => {
      const movie = movieFactory();
      const createMovieResponse = await controller.createMovie(movie);
      const timeSlotId = createMovieResponse.timeSlotsIds[0];
      return {
        movieId: createMovieResponse.movieId,
        timeSlotId,
        capacity: movie.timeSlots[0].capacity,
      };
    };

    test('should get remaining capacity for a fully booked time slot', async () => {
      // Arrange: Create a movie, reserve a time slot, and get its ID
      const { movieId, timeSlotId, capacity } =
        await createMovieAndReserveTimeSlot();

      await controller.reserveTimeSlot(movieId, timeSlotId, capacity);

      // Act: Request the remaining capacity for the reserved time slot
      const response = await request(app.getHttpServer()).get(
        `/movies/${movieId}/capacity/${timeSlotId}`,
      );

      // Assert: Check that the response contains the expected properties
      expect(response.status).toBe(200);
      expect(response.body.remainingCapacity).toBe(0); // All seats are booked
      expect(response.body.totalBookedSeats).toBeGreaterThan(0);
      expect(response.body.isAvailable).toBe(false);
    });

    test('should get remaining capacity for an empty time slot', async () => {
      // Arrange: Create a movie with an empty time slot
      const movie = movieFactory();
      const createMovieResponse = await controller.createMovie(movie);
      const timeSlotId = createMovieResponse.timeSlotsIds[0];

      // Act: Request the remaining capacity for the empty time slot
      const response = await request(app.getHttpServer()).get(
        `/movies/${createMovieResponse.movieId}/capacity/${timeSlotId}`,
      );

      // Assert: Check that the response indicates all seats are available
      expect(response.status).toBe(200);
      expect(response.body.remainingCapacity).toBe(movie.timeSlots[0].capacity);
      expect(response.body.totalBookedSeats).toBe(0);
      expect(response.body.isAvailable).toBe(true);
    });

    test('should get remaining capacity for a partially booked time slot', async () => {
      // Arrange: Create a movie and reserve some seats in a time slot
      const { movieId, timeSlotId, capacity } =
        await createMovieAndReserveTimeSlot();

      const numberOfBookings = 5;
      await controller.reserveTimeSlot(movieId, timeSlotId, numberOfBookings);

      // Act: Request the remaining capacity for the partially booked time slot
      const response = await request(app.getHttpServer()).get(
        `/movies/${movieId}/capacity/${timeSlotId}`,
      );

      // Assert: Check that the response indicates the remaining capacity and availability
      expect(response.status).toBe(200);
      expect(response.body.remainingCapacity).toBe(capacity - numberOfBookings); // No adjustment needed
      expect(response.body.totalBookedSeats).toBe(numberOfBookings);
      expect(response.body.isAvailable).toBe(true);
    });
  });

  describe('/movies (GET)', () => {
    test('should retrieve a list of movies with default pagination', async () => {
      // Arrange: Insert a few movies into the database
      for (let i = 0; i < 5; i++) {
        await service.createMovie(movieFactory());
      }

      // Act: Make a GET request to the endpoint
      const response = await controller.getMovies();

      // Assert: Expect to receive the first page of movies
      expect(response.movies.length).toBe(5);
    });

    test('should retrieve a list of movies with custom pagination', async () => {
      // Arrange: Insert a number of movies into the database
      const totalMovies = 15;
      for (let i = 0; i < totalMovies; i++) {
        await service.createMovie(movieFactory());
      }

      // Define custom pagination parameters
      const customPage = 2;
      const customLimit = 5;

      // Act: Make a GET request to the endpoint with custom pagination
      const response = await controller.getMovies(customPage, customLimit);

      // Assert: Expect to receive the specified page of movies with the specified number of items
      expect(response.movies.length).toBe(customLimit);

      // Check if nextPage is correct
      const expectedNextPage = customPage + 1;
      expect(response.nextPage).toBe(expectedNextPage);
    });

    test('should return an empty list when the requested page is beyond total pages', async () => {
      // Arrange: Insert a limited number of movies into the database
      const totalMovies = 20; // Assuming this is less than the number of movies per page multiplied by total pages
      for (let i = 0; i < totalMovies; i++) {
        await service.createMovie(movieFactory());
      }

      // Define a page number that is beyond the total number of available pages
      const pageBeyondTotal = Math.ceil(totalMovies / 10) + 1; // Assuming 10 movies per page
      const customLimit = 10;

      // Act: Make a GET request to the endpoint with a high page number
      const response = await controller.getMovies(pageBeyondTotal, customLimit);

      // Assert: The server should return an empty list
      expect(response.movies).toEqual([]);
      expect(response.nextPage).toBeNull(); // Assuming that the nextPage is null when there are no more pages
    });

    test('should return different movies for different pages', async () => {
      // Arrange: Insert a sufficient number of movies into the database
      const totalMovies = 25;
      for (let i = 0; i < totalMovies; i++) {
        await service.createMovie(movieFactory());
      }

      // Define pagination parameters
      const limit = 10;

      // Act: Make a GET request to the endpoint for the first page
      const firstPageResponse = await controller.getMovies(1, limit);

      // Act: Make another GET request to the endpoint for the second page
      const secondPageResponse = await controller.getMovies(2, limit);

      // Assert: The server should return different arrays of movies for each page
      expect(firstPageResponse.movies).not.toEqual(secondPageResponse.movies);

      // Further validation can be performed to ensure no overlap in movies
      const firstPageIds = firstPageResponse.movies.map((movie) => movie.id);
      const secondPageIds = secondPageResponse.movies.map((movie) => movie.id);
      const uniqueIds = new Set([...firstPageIds, ...secondPageIds]);
      expect(uniqueIds.size).toBe(firstPageIds.length + secondPageIds.length);
    });
  });
});
