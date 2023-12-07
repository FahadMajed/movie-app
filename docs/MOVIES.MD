## Collection: Movies

### 1. Create Movie

- **Endpoint**: `/movies`
- **Method**: `POST`
- **Description**: Creates a new movie with time slots.

#### Request Body:

```json
{
  "title": "Movie Title",
  "timeSlots": [
    {
      "startTime": "Start Time",
      "endTime": "End Time",
      "capacity": "Capacity"
    }
    // ... other time slots
  ]
}
```

#### Response:

- **HTTP 201 (Created)**:
  ```json
  {
    "movieId": "Movie ID",
    "timeSlotsIds": ["Time Slot IDs"]
  }
  ```
- **HTTP 400 (Bad Request)**:

  ```json
  {
    "message": "List Of Reasons, like the capacity should be >= 1"
  }
  ```

### 2. Reserve Time Slot

- **Endpoint**: `/movies/{movieId}/timeSlots/{timeSlotId}/reserve`
- **Method**: `POST`
- **Description**: This endpoint allows users to reserve a time slot for a movie.
- **Path Parameters**:
  - `movieId`: ID of the movie.
  - `timeSlotId`: ID of the time slot.

#### Request Body:

```json
{
  "numberOfPeople": <NUMBER_OF_PEOPLE>
}
```

#### Response:

- **HTTP 201 (Created)**:

  ```json
  {
    "success": true
  }
  ```

- **HTTP 400 (Bad Request)**:

  ```json
  {
    "message": "Failure due to insufficient capacity or invalid details. The response includes an error message"
  }
  ```

- **HTTP 404 (Not Found)**:

  ```json
  {
    "message": "State whether movie or time slot not found"
  }
  ```

### 3. Get Remaining Capacity

- **Endpoint**: `/movies/{movieId}/capacity/{timeSlotId}`
- **Method**: `GET`
- **Description**: This endpoint retrieves the remaining capacity for a specified time slot.
- **Path Parameters**:
  - `movieId`: ID of the movie.
  - `timeSlotId`: ID of the time slot.

#### Response:

- **HTTP 200 (OK)**:

  ```json
  {
    "remainingCapacity": "Remaining Capacity",
    "totalBookedSeats": "Total Booked Seats",
    "isAvailable": "Is Available (true/false)"
  }
  ```

### 4. Retrieve Movies List

- **Endpoint**: `/movies`
- **Method**: `GET`
- **Description**: This endpoint retrieves a list of movies, supporting pagination.
- **Query Parameters (optional)**:
  - `page`: Page number for pagination.
  - `limit`: Number of movies per page.

#### Responses:

- **HTTP 200 (OK)**:

  ```json
  {
    "movies": [
      {
        "id": "Movie ID",
        "title": "Movie Title",
        "timeSlotsIds": ["Time Slot IDs"]
      }
      // ... other movies
    ],
    "nextPage": "Next Page Number"
  }
  ```

- **HTTP 404 (Not Found)**:

  ```json
  {
    "message": "if page index is beyond limit"
  }
  ```
