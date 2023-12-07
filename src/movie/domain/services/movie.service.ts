import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { timestamp } from 'src/app/helpers/timestamp';
import { MovieRepository } from 'src/movie/data/repository/movie.repository';
import { CreateMovieRequest } from 'src/movie/presentation/requests/create_movie.request';
import { RemainingCapacityResponse } from 'src/movie/presentation/responses/remaining_capacity.response';
import { Movie } from '../entities/movie.entity';
import { TimeSlot } from '../entities/time_slot.entity';

@Injectable()
export class MovieService {
  constructor(private readonly movieRepository: MovieRepository) {}

  async createMovie(request: CreateMovieRequest): Promise<Movie> {
    const movie = new Movie();
    movie.title = request.title;
    movie.timeSlots = [];
    request.timeSlots.forEach((slot) => {
      const timeSlot = new TimeSlot();
      timeSlot.id = timestamp();
      timeSlot.bookedCount = 0;
      timeSlot.startTime = slot.startTime;
      timeSlot.endTime = slot.endTime;
      timeSlot.capacity = slot.capacity;

      movie.timeSlots.push(timeSlot);
    });

    movie._id = await this.movieRepository.createMovie(movie);
    return movie;
  }

  async getMovies(page: number, limit: number) {
    return await this.movieRepository.getMovies(page, limit);
  }

  async getTimeSlotRemainingCapacity(
    movieId: string,
    timeSlotId: number,
  ): Promise<RemainingCapacityResponse> {
    const timeSlot = await this.getTimeSlotByMovie(movieId, timeSlotId);

    return {
      remainingCapacity: timeSlot.getRemainingCapacity(),
      totalBookedSeats: timeSlot.bookedCount,
      isAvailable: timeSlot.isAvailable(),
    };
  }

  async reserveTimeSlot(
    movieId: string,
    timeSlotId: number,
    numberOfPeople: number,
  ): Promise<boolean> {
    const timeSlot = await this.getTimeSlotByMovie(movieId, timeSlotId);

    if (timeSlot.hasSufficientCapacity(numberOfPeople)) {
      throw new BadRequestException(
        'Insufficient capacity for the requested number of seats.',
      );
    }

    const isReserved = await this.movieRepository.attemptReservation(
      movieId,
      timeSlotId,
      numberOfPeople,
    );

    if (!isReserved) {
      throw new BadRequestException(
        'Reservation failed due to capacity limit.',
      );
    }
    return true;
  }

  private async getTimeSlotByMovie(
    movieId: string,
    timeSlotId: number,
  ): Promise<TimeSlot> {
    const movie = await this.movieRepository.findMovieById(movieId);

    if (!movie) {
      throw new NotFoundException(`Movie with ID ${movieId} not found.`);
    }

    const timeSlot = movie.findSlot(timeSlotId);

    if (!timeSlot) {
      throw new NotFoundException(
        `Time slot with ID ${timeSlotId} not found in movie ${movie.title}.`,
      );
    }
    return timeSlot;
  }
}
