import * as faker from 'faker';
import { timestamp } from 'src/app/helpers/timestamp';
import { Movie } from 'src/movie/domain/entities/movie.entity';
import { TimeSlot } from 'src/movie/domain/entities/time_slot.entity';

export const movieFactory = (overrides?: Partial<Movie>): Movie => {
  const movie = new Movie();

  movie._id = faker.datatype.uuid();
  movie.title = faker.company.companyName();
  const timeSlot = new TimeSlot();
  timeSlot.id = timestamp();
  timeSlot.bookedCount = 0;
  timeSlot.startTime = new Date('2023-12-6 21:00');
  timeSlot.endTime = new Date('2023-12-6 22:00');
  timeSlot.capacity = faker.datatype.number({ min: 20, max: 100 });
  movie.timeSlots = [timeSlot];

  if (overrides) {
    // Handle timeSlots overrides separately to ensure they are TimeSlot instances
    if (overrides.timeSlots) {
      movie.timeSlots = overrides.timeSlots.map((ts) =>
        Object.assign(new TimeSlot(), ts),
      );
      delete overrides.timeSlots; // Remove timeSlots from overrides to avoid conflicts
    }

    // Apply other overrides
    Object.assign(movie, overrides);
  }

  return movie;
};
