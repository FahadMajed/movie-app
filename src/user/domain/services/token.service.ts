import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { timestamp } from 'src/app/helpers/timestamp';

@Injectable()
export class TokensService {
  constructor(private readonly jwtService: JwtService) {}

  sign(userPayload: { email: string; userID: string }): TokenResponse {
    const payload = { ...userPayload, timestamp: timestamp() };
    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: this.jwtService.sign(payload, {
        expiresIn: '100y',
        secret: process.env.REFRESH_KEY,
      }),
      userID: userPayload.userID,
    };
  }
}

export type TokenResponse = {
  accessToken: string;
  refreshToken: string;
  userID: string;
};
