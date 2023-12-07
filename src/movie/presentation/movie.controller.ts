import { Body, Controller, Get, Post } from '@nestjs/common';
import { MovieService } from '../domain/services/movie.service';
import { CreateMovieRequest } from './requests/create_movie.request';

@Controller('movies')
export class MoviesController {
  constructor(private readonly movieService: MovieService) {}

  @Post()
  async createMovie(@Body() request: CreateMovieRequest): Promise<string> {
    //TODO CREATE MOVIE

    return '';
  }

  @Get()
  getAllMovies() {
    //TODO GET ALL MOVIES
  }
}
