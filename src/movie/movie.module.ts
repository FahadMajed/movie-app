import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MovieRepository } from './data/repository/movie.repository';

import { MovieService } from './domain/services/movie.service';
import { MoviesController } from './presentation/movie.controller';
import { MovieSchema } from './data/schemas/movie.schema';

@Module({
  imports: [TypeOrmModule.forFeature([MovieSchema])],
  providers: [MovieService, MovieRepository],
  controllers: [MoviesController],
})
export class MovieModule {}
