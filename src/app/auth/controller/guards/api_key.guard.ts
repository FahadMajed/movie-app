import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly apiKey = process.env.API_KEY;
  private healthCheckEndpoint = '/health';
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();

    if (request.url == this.healthCheckEndpoint) {
      return true;
    }

    const apiKey = request.headers['key'];

    if (apiKey !== this.apiKey) {
      throw new UnauthorizedException('Invalid API Key');
    }

    return true;
  }
}
