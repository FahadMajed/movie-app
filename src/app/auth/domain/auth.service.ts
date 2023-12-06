import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from 'src/user/domain/user.service';

import * as bcrypt from 'bcryptjs';
import { CreateUserRequest } from 'src/app/auth/controller/requests/create_user.request';
import { User } from 'src/user/domain/entities/user.entity';
import { TokenResponse, TokensService } from './token.service';

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

  async createTokenForAnon(user: User): Promise<TokenResponse> {
    const response = await this.tokensService.signForAnon(user.id);
    const refreshTokenHashed = await this.hash(response.refreshToken);

    this.userService.addRefreshToken(refreshTokenHashed, user.id);

    return response;
  }

  async validateAppleToken(
    idToken: string,
    userAppleId: string,
  ): Promise<boolean> {
    return this.tokensService.validateAppleToken(idToken, userAppleId);
  }

  async validateGoogleToken(
    idToken: string,
    userEmail: string,
  ): Promise<boolean> {
    return this.tokensService.validateGoogleToken(idToken, userEmail);
  }

  async generateTokenByRefresh(
    refreshToken: string,
    userID: number,
  ): Promise<string> {
    const user = await this.userService.findById(userID);

    const isTokenValid = refreshToken == user.refreshTokenHashed;

    if (isTokenValid == false) {
      throw new UnauthorizedException("You Don't Own The Refresh Token");
    }

    return this.tokensService.sign({ email: user.email, userID: user.id })
      .accessToken;
  }

  async signInWithProvider(email: string): Promise<TokenResponse> {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('Email Not Found');
    }

    return await this.createToken(user);
  }

  async registerWithProvider(
    email: string,
    firstName: string,
    lastName: string,
  ): Promise<TokenResponse> {
    const user = await this.userService.create({
      firstName: firstName ?? '',
      lastName: lastName ?? '',
      email: email,
    });

    return await this.createToken(user);
  }

  async linkAnonymousAccount(email: string, userID: number): Promise<boolean> {
    const user = await this.userService.findById(userID);

    user.email = email;
    user.isAnonymous = false;

    await this.userService.updateUser(user);

    return true;
  }

  private async createToken(user: User): Promise<TokenResponse> {
    const response = this.tokensService.sign({
      email: user.email,
      userID: user.id,
    });

    this.userService.addRefreshToken(response.refreshToken, user.id);

    return response;
  }

  private async hash(value: string): Promise<string> {
    return bcrypt.hash(value, 10);
  }
}
