import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';

import { Request, Response } from 'express';
import { LogsService } from '../logs/logs.service';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: LogsService) {}
  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (exception instanceof UnauthorizedException == false)
      this.logger.error(exception.message, exception.stack);
    if (response.headersSent) {
      return;
    }
    if (exception instanceof HttpException) {
      response.status(exception.getStatus()).json({
        statusCode: exception.getStatus(),
        message: exception.message,
        path: request.url,
      });
    } else {
      response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: exception.message,
        path: request.url,
      });
    }
  }
}
