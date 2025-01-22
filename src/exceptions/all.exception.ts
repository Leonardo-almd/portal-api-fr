import { ExceptionFilter, Catch, ArgumentsHost, HttpException, Logger } from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const status = exception instanceof HttpException ? exception.getStatus() : 500;

    // Capturar detalhes do erro
    const stack = exception instanceof Error ? exception.stack : null;
    const message =
      exception instanceof HttpException
        ? exception.message
        : 'Internal server error';

    // Logar informações detalhadas com stack trace
    this.logger.error(
      `Status: ${status} | Message: ${message} | Path: ${request.url} | Stack: ${stack}`,
    );

    // Retornar a resposta para o cliente
    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: message,
    });
  }
}
