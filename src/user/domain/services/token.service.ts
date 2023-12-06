import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client } from 'google-auth-library';

import { timestamp } from 'src/app/helpers/timestamp';

@Injectable()
export class TokensService {
  constructor(
    private readonly googleClient: OAuth2Client,
    private readonly jwtService: JwtService,
  ) {}

  sign(userPayload: { email: string; userID: number }): TokenResponse {
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
  userID: number;
};
