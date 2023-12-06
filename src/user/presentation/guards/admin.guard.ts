import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    if (request.method == 'POST') {
      if (request.url.includes('/education-program')) {
        return request.user?.isAdmin();
      }
    }
    return true;
  }
}
