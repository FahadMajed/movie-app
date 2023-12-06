import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { OAuth2Client } from 'google-auth-library';
import { UserModule } from 'src/user/user.module';
import { AppleAuthController } from './controller/apple.controller';
import { AuthController } from './controller/auth.controller';
import { GoogleAuthController } from './controller/google.controller';

import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './controller/guards/jwt.guard';
import { AuthService } from './domain/auth.service';
import { TokensService } from './domain/token.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn:
            configService.get('CLOUD') == 'true' ? 60 * 60 * 24 * 30 : '100y',
        },
      }),
    }),
    UserModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  providers: [
    AuthService,
    TokensService,
    JwtStrategy,
    {
      provide: OAuth2Client,
      useFactory: () =>
        new OAuth2Client({
          // eslint-disable-next-line @typescript-eslint/naming-convention
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_SECRET,
        }),
    },
  ],
  controllers: [AuthController, AppleAuthController, GoogleAuthController],
})
export class AuthModule {}
