import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';

import { AuthService } from './domain/services/auth.service';
import { TokensService } from './domain/services/token.service';
import { UserService } from './domain/services/user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserSchema } from './data/schema/user.schema';
import { UserController } from './presentation/user.controller';
import { UserRepository } from './data/user.repository';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserSchema]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: '100y', //should be fixed in real env
        },
      }),
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  providers: [UserService, AuthService, TokensService, UserRepository],
  controllers: [UserController],
})
export class UserModule {}
