import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = this.extractMessage(exception);

    if (exception instanceof HttpException) {
      if (Number(status) >= HttpStatus.INTERNAL_SERVER_ERROR) {
        this.logger.error(
          `${request.method} ${request.url} → ${status}`,
          exception.stack,
        );
      }
    } else {
      this.logger.error(
        `${request.method} ${request.url} → unhandled exception`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      message,
    });
  }

  private extractMessage(exception: unknown): string | string[] {
    if (!(exception instanceof HttpException)) {
      return 'Internal server error';
    }

    const response = exception.getResponse();
    if (typeof response === 'string') {
      return response;
    }

    if (typeof response === 'object' && response !== null) {
      const payload = response as { message?: string | string[] };
      if (
        typeof payload.message === 'string' ||
        Array.isArray(payload.message)
      ) {
        return payload.message;
      }
    }

    return exception.message;
  }
}
