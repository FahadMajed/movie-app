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

@Controller('auth/apple')
export class AppleAuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  async appleRegister(
    @Body('idToken') idToken: string,
    @Body('userAppleId') userAppleID: string,
    @Body('firstName') firstName?: string,
    @Body('lastName') lastName?: string,
  ): Promise<{ accessToken: string; userID: number }> {
    const isValid = await this.authService.validateAppleToken(
      idToken,
      userAppleID,
    );
    if (isValid) {
      return await this.authService.registerWithProvider(
        userAppleID,
        firstName,
        lastName,
      );
    } else {
      throw new BadRequestException();
    }
  }

  @Public()
  @Post('sign-in')
  async appleSignIn(
    @Body('idToken') idToken: string,
    @Body('email') email: string,
  ) {
    const isValid = await this.authService.validateAppleToken(idToken, email);
    if (isValid) {
      return await this.authService.signInWithProvider(email);
    } else {
      throw new BadRequestException();
    }
  }

  @Public()
  @Post('link-account')
  async linkAppleAccount(
    @Body('idToken') idToken: string,
    @Body('email') email: string,
    @Body('userID') userID: number,
    @Res() response: Response,
  ) {
    const isValid = await this.authService.validateAppleToken(idToken, email);
    if (!isValid) {
      throw new BadRequestException('Invalid Google Token');
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
