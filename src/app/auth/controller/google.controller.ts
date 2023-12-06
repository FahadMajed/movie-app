import {
  BadRequestException,
  Body,
  Controller,
  HttpStatus,
  Post,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { Public } from '../../decorators/public.decorator';
import { AuthService } from '../domain/auth.service';

@Controller('auth/google')
export class GoogleAuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  async googleRegister(
    @Body('idToken') idToken: string,
    @Body('email') email: string,
    @Body('firstName') firstName: string,
    @Body('lastName') lastName: string,
  ) {
    const isValid = await this.authService.validateGoogleToken(idToken, email);
    if (isValid) {
      return await this.authService.registerWithProvider(
        email,
        firstName,
        lastName,
      );
    } else {
      throw new BadRequestException();
    }
  }

  @Public()
  @Post('sign-in')
  async googleSignIn(
    @Body('idToken') idToken: string,
    @Body('email') email: string,
  ) {
    const isValid = await this.authService.validateGoogleToken(idToken, email);
    if (isValid) {
      return await this.authService.signInWithProvider(email);
    } else {
      throw new BadRequestException();
    }
  }

  @Public()
  @Post('link-account')
  async linkGoogleAccount(
    @Body('idToken') idToken: string,
    @Body('email') email: string,
    @Body('userID') userID: number,
    @Res() response: Response,
  ) {
    const isValid = await this.authService.validateGoogleToken(idToken, email);
    if (!isValid) {
      throw new BadRequestException('Invalid Provider Token');
    }

    const isLinked = await this.authService.linkAnonymousAccount(email, userID);
    if (!isLinked) {
      throw new BadRequestException('Failed to link accounts');
    }

    return response.status(HttpStatus.OK).send({
      status: HttpStatus.OK,
      message: 'Successfully linked accounts',
    });
  }
}
