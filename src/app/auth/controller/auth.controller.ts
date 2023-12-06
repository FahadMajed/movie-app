import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { CreateUserRequest } from 'src/app/auth/controller/requests/create_user.request';
import { UserService } from 'src/user/domain/user.service';
import { Public, Refresh } from '../../decorators/public.decorator';
import { AuthService } from '../domain/auth.service';
import { TokenResponse } from '../domain/token.service';
import { JwtRefreshGuard } from './guards/jwt.guard';
import { SameUserGuard } from './guards/same_user.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Public()
  @Post('register')
  async register(
    @Body('user') request: CreateUserRequest,
  ): Promise<TokenResponse> {
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

  @Public()
  @Post('anonymous-sign-in')
  async anonymousSignIn(): Promise<TokenResponse> {
    const user = await this.userService.create({
      isAnonymous: true,
    });
    return await this.authService.createTokenForAnon(user);
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
      Number(request['user']['userID']),
    );

    return { accessToken: accessToken };
  }

  @UseGuards(SameUserGuard)
  @Post('secure')
  async secure() {
    return 'SUCCESS';
  }
}
