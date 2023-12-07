import { TimeSlot } from './time_slot.entity';

export class Movie {
  _id: any;
  title: string;
  timeSlots: TimeSlot[];

  findSlot(timeSlotId: number) {
    return this.timeSlots.find((ts) => ts.id === timeSlotId);
  }

  static fromPlain(plain: object): Movie {
    const movie = new Movie();
    if (!plain) return;
    Object.assign(movie, plain);
    movie.timeSlots = plain['timeSlots']?.map((ts) =>
      Object.assign(new TimeSlot(), ts),
    );
    return movie;
  }
}
