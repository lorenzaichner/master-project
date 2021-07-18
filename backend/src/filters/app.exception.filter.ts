import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { Request, Response } from 'express';
import { AppError } from 'src/errors/app.error';
import { Logger } from 'src/log/logger';

@Catch()
export class AppExceptionFilter implements ExceptionFilter<AppError> {
  catch(error: AppError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if(error.innerErrors != null && error.innerErrors.length > 0) {
      Logger.getInstance().log('error', {
        error: error,
      });
    } else {
      Logger.getInstance().log('error', {
        error: error,
        innerErrors: error.innerErrors,
      });
    }

    response
      .status(400)
      .json({
        success: false,
        statusCode: error.status,
        // timestamp: new Date().toISOString(),
        path: request.url,
        errorName: error.name,
        errorMessage: error.message,
      });
  }
}
