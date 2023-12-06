export class TimeSlot {
  id: string;
  startTime: Date;
  endTime: Date;
  capacity: number;
  bookedCount: number;

  hasSufficientCapacity(numberOfPeople: number) {
    return this.bookedCount + numberOfPeople > this.capacity;
  }
}
