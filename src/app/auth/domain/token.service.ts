import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client } from 'google-auth-library';

import * as jwksClient from 'jwks-rsa';
import { timestamp } from 'src/app/helpers/timestamp';
import * as util from 'util';

@Injectable()
export class TokensService {
  constructor(
    private readonly googleClient: OAuth2Client,
    private readonly jwtService: JwtService,
  ) {}

  async validateAppleToken(
    idToken: string,
    userAppleId: string,
  ): Promise<boolean> {
    const client = jwksClient({
      jwksUri: 'https://appleid.apple.com/auth/keys',
    });

    const getSigningKey = util.promisify(client.getSigningKey);
    const decoded = this.jwtService.decode(idToken, { complete: true });

    if (!decoded || !decoded['header'] || !decoded['header'].kid) {
      throw new Error('Invalid token');
    }

    const key = await getSigningKey(decoded['header'].kid);
    const signingKey = key.getPublicKey();

    const payload = this.jwtService.verify(idToken, {
      publicKey: signingKey,
      algorithms: ['RS256'],
    });

    if (payload && payload.sub === userAppleId) {
      return true;
    }
    return false;
  }

  async validateGoogleToken(
    idToken: string,
    userEmail: string,
  ): Promise<boolean> {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
      });
      const payload = ticket.getPayload();

      if (payload && payload.email === userEmail) {
        return true;
      }
    } catch (e) {
      console.log(e);
    }
    return false;
  }

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

  async signForAnon(userID: number): Promise<TokenResponse> {
    const payload = {
      isAnonymous: true,
      userID: userID,
      timestamp: timestamp(),
    };

    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: this.jwtService.sign(payload, {
        expiresIn: '100y',
        secret: process.env.REFRESH_KEY,
      }),
      userID: userID,
    };
  }
}

export type TokenResponse = {
  accessToken: string;
  refreshToken: string;
  userID: number;
};
