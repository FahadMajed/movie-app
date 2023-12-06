import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { Movie } from '../entities/movie.entity';

@Injectable()
export class MovieService {
  constructor(
    @InjectRepository(Movie)
    private readonly movieRepository: MongoRepository<Movie>,
  ) {}

  async reserveTimeSlot(
    movieId: string,
    timeSlotId: string,
    numberOfPeople: number,
  ): Promise<void> {
    const movie = await this.movieRepository.findOneBy({ id: movieId });

    if (!movie) {
      throw new NotFoundException(`Movie with ID ${movieId} not found.`);
    }

    const timeSlot = movie.findSlot(timeSlotId);

    if (!timeSlot) {
      throw new NotFoundException(
        `Time slot with ID ${timeSlotId} not found in movie ${movie.title}.`,
      );
    }

    if (timeSlot.hasSufficientCapacity(numberOfPeople)) {
      throw new BadRequestException(
        'Insufficient capacity for the requested number of seats.',
      );
    }

    const reservationSuccessful = await this.attemptReservation(
      movieId,
      timeSlotId,
      numberOfPeople,
    );

    if (!reservationSuccessful) {
      throw new BadRequestException(
        'Reservation failed due to an unexpected error.',
      );
    }
  }

  private async attemptReservation(
    movieId: string,
    timeSlotId: string,
    numberOfPeople: number,
  ): Promise<boolean> {
    const updateResult = await this.movieRepository.findOneAndUpdate(
      {
        _id: movieId,
        'timeSlots.id': timeSlotId,
        'timeSlots.bookedCount': {
          $lte: {
            $subtract: ['$timeSlots.capacity', numberOfPeople],
          },
        },
      },
      { $inc: { 'timeSlots.$.bookedCount': numberOfPeople } },
      { returnDocument: 'after' },
    );

    return updateResult.value !== null;
  }
}
