export class TimeSlot {
  id: number;
  startTime: Date;
  endTime: Date;
  capacity: number;
  bookedCount: number;

  hasSufficientCapacity(numberOfPeople: number) {
    return this.bookedCount + numberOfPeople > this.capacity;
  }

  isAvailable() {
    return this.bookedCount < this.capacity;
  }
}
