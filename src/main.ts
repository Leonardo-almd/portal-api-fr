import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { PermissionSeeder } from './seeders/permission.seeder';
import { DataSource } from 'typeorm';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(helmet());
  app.enableCors();

  // Obtendo o DataSource diretamente do NestJS
  const dataSource = app.get(DataSource);

  // Executando o Seeder
  await PermissionSeeder.seed(dataSource);

  await app.listen(3000);
}
bootstrap();
