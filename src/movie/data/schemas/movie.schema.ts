import { Movie } from 'src/movie/domain/entities/movie.entity';
import { EntitySchema } from 'typeorm';

export const MovieSchema = new EntitySchema({
  name: 'Movie',
  target: Movie,
  columns: {
    _id: {
      type: String,
      objectId: true,
      primary: true,
    },
    title: {
      type: String,
      nullable: false,
    },
    timeSlots: {
      type: 'json',
      nullable: true,
    },
    version: {
      type: Number,
      default: 0,
    },
  },
});
