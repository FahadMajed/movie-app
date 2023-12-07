import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { MovieService } from '../domain/services/movie.service';
import { CreateMovieRequest } from './requests/create_movie.request';
import { GetMoviesResponse } from './responses/get_movies.response';
import { RemainingCapacityResponse } from './responses/remaining_capacity.response';

@Controller('movies')
export class MoviesController {
  constructor(private readonly movieService: MovieService) {}

  @Post()
  async createMovie(
    @Body() request: CreateMovieRequest,
  ): Promise<{ movieId: string; timeSlotsIds: number[] }> {
    const movie = await this.movieService.createMovie(request);
    return {
      movieId: movie._id,
      timeSlotsIds: movie.timeSlots.map((timeSlot) => timeSlot.id),
    };
  }

  @Post(':movieId/capacity/:timeSlotId')
  async getTimeSlotRemainingCapacity(
    @Param('movieId') movieId: string,
    @Param('timeSlotId', ParseIntPipe) timeSlotId: number,
  ): Promise<RemainingCapacityResponse> {
    return await this.movieService.getTimeSlotRemainingCapacity(
      movieId,
      timeSlotId,
    );
  }

  @Post(':movieId/timeSlots/:timeSlotId/reserve')
  async reserveTimeSlot(
    @Param('movieId') movieId: string,
    @Param('timeSlotId', ParseIntPipe) timeSlotId: number,
    @Body('numberOfPeople', ParseIntPipe) numberOfPeople: number,
  ): Promise<{ success: boolean }> {
    return await this.movieService
      .reserveTimeSlot(movieId, timeSlotId, numberOfPeople)
      .then((result) => {
        return {
          success: result,
        };
      });
  }

  @Get()
  async getMovies(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ): Promise<GetMoviesResponse> {
    limit = limit > 100 ? 100 : limit;
    const response = await this.movieService.getMovies(page, limit);

    // Map movies to include only the timeSlot IDs
    const mappedMovies = response[0].map((movie) => ({
      id: movie._id,
      title: movie.title,
      timeSlotsIds: movie.timeSlots.map((timeSlot) => timeSlot.id),
    }));

    return {
      movies: mappedMovies,
      nextPage: response[1],
    };
  }
}
