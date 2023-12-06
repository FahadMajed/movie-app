import { TimeSlot } from './time_slot.entity';

export class Movie {
  id: string;
  title: string;
  timeSlots: TimeSlot[];

  findSlot(timeSlotId: string) {
    return this.timeSlots.find((ts) => ts.id === timeSlotId);
  }
}
