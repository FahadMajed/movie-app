import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { UnauthorizedException } from '@nestjs/common/exceptions/unauthorized.exception';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/domain/services/user.service';

/**A GUARD TO ENSURE THE REQUEST USER OWNS THE RESOURCE, E.G. ThE USER ID
 * IN THE TOKEN EQUALS TO THE USER ID IN THE REQUEST**/
@Injectable()
export class SameUserGuard implements CanActivate {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();

    const token = request.headers['authorization']?.split(' ')[1];

    if (token) {
      const payload = this.jwtService.verify(token, { ignoreExpiration: true });

      const tokenUser = await this.userService.findById(payload.userID);

      const actualUserId = request.params?.id ?? request.body.userID;

      if (tokenUser._id !== actualUserId) {
        throw new UnauthorizedException(
          'You cannot access someone else’s data',
        );
      }
    }
    return true;
  }
}
