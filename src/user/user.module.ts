import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';

import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserSchema } from './data/schema/user.schema';
import { UserRepository } from './data/user.repository';
import { AuthService } from './domain/services/auth.service';
import { TokensService } from './domain/services/token.service';
import { UserService } from './domain/services/user.service';
import { JwtStrategy } from './presentation/guards/jwt.guard';
import { UserController } from './presentation/user.controller';

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
  providers: [
    UserService,
    AuthService,
    TokensService,
    UserRepository,
    JwtStrategy,
  ],
  controllers: [UserController],
})
export class UserModule {}
