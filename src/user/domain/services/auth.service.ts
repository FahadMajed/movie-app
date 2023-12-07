import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import * as bcrypt from 'bcryptjs';
import { CreateUserRequest } from 'src/user/presentation/requests/create_user.request';

import { User } from '../entities/user.entity';
import { TokenResponse, TokensService } from './token.service';
import { UserService } from './user.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly tokensService: TokensService,
  ) {}

  async registerWithEmail(request: CreateUserRequest): Promise<TokenResponse> {
    const hashedPassword = await this.hash(request.password);
    const user = await this.userService.create({
      ...request,
      password: hashedPassword,
    });
    return await this.createToken(user);
  }

  async signInWithEmail(
    email: string,
    password: string,
  ): Promise<TokenResponse> {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new BadRequestException('Email Not Found');
    }
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (isPasswordValid == false) {
      throw new BadRequestException('Incorrect Password');
    } else return await this.createToken(user);
  }

  async generateTokenByRefresh(
    refreshToken: string,
    userID: string,
  ): Promise<string> {
    const user = await this.userService.findById(userID);

    const isTokenValid = refreshToken == user.refreshTokenHashed;

    if (isTokenValid == false) {
      throw new UnauthorizedException("You Don't Own The Refresh Token");
    }

    return this.tokensService.sign({ email: user.email, userID: user._id })
      .accessToken;
  }

  private async createToken(user: User): Promise<TokenResponse> {
    const response = this.tokensService.sign({
      email: user.email,
      userID: user._id,
    });

    await this.userService.addRefreshToken(response.refreshToken, user._id);

    return response;
  }

  private async hash(value: string): Promise<string> {
    return bcrypt.hash(value, 10);
  }
}
