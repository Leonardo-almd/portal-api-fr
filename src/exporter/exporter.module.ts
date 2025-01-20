import { Module } from '@nestjs/common';
import { ExporterService } from './exporter.service';
import { ExporterController } from './exporter.controller';
import { User } from 'src/entities/user.entity';
import { Exporter } from 'src/entities/exporter.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Exporter, User])],
  controllers: [ExporterController],
  providers: [ExporterService],
  exports: [ExporterService],
})
export class ExporterModule {}
