import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MovieSchema } from './data/schemas/movie.schema';
import { MovieService } from './domain/services/movie.service';
import { MoviesController } from './presentation/movie.controller';

@Module({
  imports: [TypeOrmModule.forFeature([MovieSchema])],
  providers: [MovieService],
  controllers: [MoviesController],
})
export class MovieModule {}
