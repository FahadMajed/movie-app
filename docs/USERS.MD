## Collection: Authentication

### 1. User Registration

- **Endpoint**: `/users/register`
- **Method**: `POST`
- **Description**: This endpoint is used for registering a new user.
- **Request Body**:
  ```json
  {
    "email": "<USER_EMAIL>",
    "password": "<USER_PASSWORD>"
  }
  ```

#### Responses:

- `200 OK`: Successfully created a new user. The response includes `accessToken`, `refreshToken` and `userID`.
- `400 Bad Request`: Failure due to an existing email. The response includes an error message.

### 2. User Sign In

- **Endpoint**: `/users/sign-in`
- **Method**: `POST`
- **Description**: This endpoint is used for signing in an existing user.
- **Request Body**:
  ```json
  {
    "email": "<USER_EMAIL>",
    "password": "<USER_PASSWORD>"
  }
  ```

#### Responses:

- `200 OK`: Successfully signed in. The response includes `accessToken`, `refreshToken` and `userID`.
- `400 Bad Request`: Failure due to incorrect credentials or unregistered email. The response includes an error message.

### 3. Refresh Access Token

- **Endpoint**: `/users/refresh`
- **Method**: `POST`
- **Description**: This endpoint is used for refreshing access tokens.
- **Request Headers**:
  - `Authorization`: `Bearer <ACCESS_TOKEN>`
- **Request Body**:
  ```json
  {
    "refreshToken": "<REFRESH_TOKEN>"
  }
  ```

#### Responses:

- `200 OK`: Successfully generated a new access token. The response includes the new `accessToken`.
- `401 Unauthorized`: Failure due to missing or invalid tokens. The response includes an error message indicating the specific issue.
