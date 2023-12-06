import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './presentation/auth.controller';

import { JwtStrategy } from './presentation/guards/jwt.guard';
import { AuthService } from './domain/services/auth.service';
import { TokensService } from './domain/services/token.service';
import { UserService } from './domain/services/user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserSchema } from './data/schema/user.schema';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserSchema]),

    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  providers: [UserService, AuthService, TokensService, JwtStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
