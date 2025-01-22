import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { PermissionSeeder } from './seeders/permission.seeder';
import { DataSource } from 'typeorm';
import { Logger } from '@nestjs/common';
import { AllExceptionsFilter } from './exceptions/all.exception';
import { LoggingInterceptor } from './interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(helmet());
  app.useLogger(new Logger());
  app.enableCors();

  app.useGlobalFilters(new AllExceptionsFilter());

  app.useGlobalInterceptors(new LoggingInterceptor());

  // Obtendo o DataSource diretamente do NestJS
  const dataSource = app.get(DataSource);

  // Executando o Seeder
  await PermissionSeeder.seed(dataSource);

  await app.listen(3000);
}
bootstrap();
