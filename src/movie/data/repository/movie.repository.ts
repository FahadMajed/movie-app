import { CACHE_MANAGER, CacheModule } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ObjectId } from 'mongodb';
import { Cacheable } from 'src/app/decorators/cacheable.decorator';
import { Movie } from 'src/movie/domain/entities/movie.entity';
import { MongoRepository } from 'typeorm/repository/MongoRepository';

@Injectable()
export class MovieRepository {
  constructor(
    @InjectRepository(Movie)
    private readonly repository: MongoRepository<Movie>,

    @Inject(CACHE_MANAGER)
    private cacheManager: CacheModule,
  ) {}

  async createMovie(movie: Movie) {
    const savedMovie = await this.repository.save({ ...movie, version: 0 });
    const id = new ObjectId(savedMovie._id);

    return id.toString();
  }

  @Cacheable({ keyPrefix: 'movies' })
  async getMovies(page: number, limit: number): Promise<[Movie[], number]> {
    const [movies, total] = await this.repository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    // Calculate next page, set to null if current page is the last
    const nextPage = page < totalPages ? page + 1 : null;

    return [movies, nextPage];
  }

  /**
   * Attempt to make a reservation for a movie at a specific time slot.
   *
   * @param {any} movieId - The unique identifier of the movie.
   * @param {number} timeSlotId - The ID of the time slot for the reservation.
   * @param {number} numberOfPeople - The number of people to reserve for.
   * @returns {Promise<boolean>} A boolean indicating whether the reservation was successful.
   *
   * @throws {Error} Throws an error if the reservation fails due to conflicts or other issues.
   */
  async attemptReservation(
    movieId: any,
    timeSlotId: number,
    numberOfPeople: number,
  ): Promise<boolean> {
    const movieObjectId = new ObjectId(movieId);

    const currentVersion = await this.findMovieVersion(movieId);

    const movie = await this.findValidMovie(
      movieObjectId,
      timeSlotId,
      currentVersion,
    );

    if (!movie) {
      false;
    }

    const updateResult = await this.repository.findOneAndUpdate(
      {
        _id: movieObjectId,
        'timeSlots.id': timeSlotId,
        version: currentVersion,
      },
      {
        $inc: { 'timeSlots.$.bookedCount': numberOfPeople },
        $set: { version: currentVersion + 1 }, // Update the version
      },
      { returnDocument: 'after' },
    );

    return updateResult.ok == 1;
  }

  async findValidMovie(id: any, timeSlotId: number, currentVersion: number) {
    return await this.repository.findOne({
      where: {
        _id: id,
        'timeSlots.id': timeSlotId,
        version: currentVersion,
        $expr: { $lt: ['$timeSlots.bookedCount', '$timeSlots.capacity'] },
      },
    });
  }

  async findMovieById(id: string) {
    const movieData = await this.repository.findOneBy({
      _id: new ObjectId(id),
    });
    return Movie.fromPlain(movieData);
  }

  private async findMovieVersion(id: string) {
    const movieData = await this.findMovieById(id);
    return movieData['version'];
  }
}
