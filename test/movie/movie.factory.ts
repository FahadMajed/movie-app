import * as faker from 'faker';
import { timestamp } from 'src/app/helpers/timestamp';
import { Movie } from 'src/movie/domain/entities/movie.entity';
import { TimeSlot } from 'src/movie/domain/entities/time_slot.entity';

export const movieFactory = (overrides?: Partial<Movie>): Movie => {
  const movie = new Movie();

  movie._id = generateRandomObjectId();
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

function generateRandomObjectId() {
  const timestamp = Math.floor(new Date().getTime() / 1000).toString(16); // Unix timestamp in hex
  const machineId = faker.datatype
    .number({ min: 0, max: 16777215 })
    .toString(16); // 3 bytes in hex
  const processId = process.pid.toString(16).padStart(4, '0'); // 2 bytes in hex
  const counter = faker.datatype
    .number({ min: 0, max: 65535 })
    .toString(16)
    .padStart(4, '0'); // 2 bytes in hex

  // Combine the parts to create a 24-character hexadecimal string
  const objectId = timestamp + machineId + processId + counter;

  // Convert the hexadecimal string to a MongoDB ObjectId
  return objectId;
}
