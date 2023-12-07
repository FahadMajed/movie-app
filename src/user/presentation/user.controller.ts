import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { CreateUserRequest } from 'src/user/presentation/requests/create_user.request';

import { AuthService } from '../domain/services/auth.service';
import { TokenResponse } from '../domain/services/token.service';
import { JwtRefreshGuard } from './guards/jwt.guard';

import { Public, Refresh } from 'src/app/decorators/public.decorator';

@Controller('users')
export class UserController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  async register(@Body() request: CreateUserRequest): Promise<TokenResponse> {
    return await this.authService.registerWithEmail(request);
  }

  @Public()
  @Post('sign-in')
  async signIn(
    @Body('email') email: string,
    @Body('password') password: string,
  ): Promise<TokenResponse> {
    return await this.authService.signInWithEmail(email, password);
  }

  @Refresh()
  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  async refreshToken(
    @Req() request: Request,
    @Body() body: { refreshToken: string },
  ): Promise<{ accessToken: string }> {
    const accessToken = await this.authService.generateTokenByRefresh(
      body.refreshToken,
      request['user']['userID'],
    );

    return { accessToken: accessToken };
  }
}
