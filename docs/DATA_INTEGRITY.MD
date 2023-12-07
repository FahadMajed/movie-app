## How Data Integrity is Handled

In Movie Reservation System, data integrity is crucial to ensure accurate and consistent movie reservations. The system employs a technique that leverages a combination of techniques to handle data integrity effectively.

### Approach to Data Integrity

1. **Concurrency Control**: To prevent race conditions and ensure data consistency, the system employs a versioning mechanism. Each movie record maintains a version number that is incremented on each update. This version number is used to detect conflicts and ensure that only one reservation succeeds for a given time slot.

2. **Atomic Updates**: To maintain data integrity, the system uses atomic updates when making reservations. Atomic updates ensure that the bookedCount of a time slot is incremented atomically along with the version number update, preventing issues where multiple reservations can overlap and exceed the available capacity.

### Technique Used

The following technique is employed to handle data integrity:

- **Optimistic Concurrency Control**: The system uses an optimistic concurrency control approach. When attempting a reservation, it first retrieves the current version of the movie. Then, it verifies if the requested time slot is still available by checking the version and the existence of the time slot. If the conditions are met, it proceeds to update the bookedCount atomically, ensuring data consistency.

Here's a simplified code snippet of the technique used:

```javascript
async attemptReservation(
  movieId: any,
  timeSlotId: number,
  numberOfPeople: number,
): Promise<boolean> {
  const movieObjectId = new ObjectId(movieId);

  const currentVersion = await this.findMovieVersion(movieId);

  const movie = await this.findValidMovie(
    movieObjectId,
    timeSlotId,
    currentVersion,
  );

  if (!movie) {
    return false;
  }

  const updateResult = await this.repository.findOneAndUpdate(
    {
      _id: movieObjectId,
      'timeSlots.id': timeSlotId,
      version: currentVersion,
    },
    {
      $inc: { 'timeSlots.$.bookedCount': numberOfPeople },
      $set: { version: currentVersion + 1 }, // Update the version
    },
    { returnDocument: 'after' },
  );

  return updateResult.ok == 1;
}

  async findValidMovie(id: any, timeSlotId: number, currentVersion: number) {
    return await this.repository.findOne({
      where: {
        _id: id,
        'timeSlots.id': timeSlotId,
        version: currentVersion,
        $expr: { $lt: ['$timeSlots.bookedCount', '$timeSlots.capacity'] },
      },
    });
  }
```

This technique ensures that reservations are handled in a way that maintains data integrity and prevents conflicts, even in concurrent scenarios.
