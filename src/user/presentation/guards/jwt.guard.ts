import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard, PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, VerifiedCallback } from 'passport-jwt';
import { PublicKey, RefreshKey } from 'src/app/decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(PublicKey, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const isRefresh = this.reflector.getAllAndOverride<boolean>(RefreshKey, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isRefresh) {
      return true;
    }

    return super.canActivate(context);
  }
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  validate(payload: any, done: VerifiedCallback) {
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return done(new UnauthorizedException('Token expired'), false);
    }

    return done(null, payload);
  }
}

@Injectable()
export class JwtRefreshGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();

    const token = request.headers['authorization']?.split(' ')[1];

    const refreshToken = request.body.refreshToken;

    try {
      this.jwtService.verify(refreshToken, { secret: process.env.REFRESH_KEY });

      this.jwtService.verify(token, { ignoreExpiration: true });

      request.user = this.jwtService.decode(token);
      return true;
    } catch (e) {
      throw new UnauthorizedException({ message: e.message, error: e.name });
    }
  }
}
