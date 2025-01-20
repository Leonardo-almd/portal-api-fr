import { Controller, Delete, Get, Param, ParseIntPipe, Query, UseGuards, Request, Body, Post } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { trimObjectStrings } from 'src/helpers/helpers';
import { PermissionsGuard } from 'src/guards/permissions.guard';
import { Permissions } from '../decorators/permissions.decorator';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExporterService } from './exporter.service';
import { Exporter } from 'src/entities/exporter.entity';

type CreatePayload = Omit<Exporter, 'created_at' | 'updated_at' | 'deleted_at'>;

@UseGuards(AuthGuard('jwt'), PermissionsGuard)

@Controller('api/exporter')
export class ExporterController {
    constructor(private readonly service: ExporterService,
      @InjectRepository(Exporter)
          private readonly repository: Repository<Exporter>) {
      
    }
  
    @Get('quicksearch')
    @Permissions('exporters')
    async quickSearch(@Query('value') filter: string) {
      filter === 'undefined' || filter === 'null' ? filter = null : filter;
      return this.service.quickSearch(filter?.trim());
    }
  
    @Get('quicksearch/:id')
    @Permissions('exporters')
    async quickSearchById(@Param('id', ParseIntPipe) id: number) {
      const exporter = await this.repository.findOne({ where: { id } });
      return {label: exporter.name, value: exporter.id}
    }
  
    @Get()
    @Permissions('exporters')
    async findAll(@Query('page', ParseIntPipe) page: number = 1, @Query('pageSize', ParseIntPipe) pageSize: number = 10, @Query('search') search: string) {
      const queryParams = { page: Number(page), pageSize: Number(pageSize), search: search?.trim() };
      return this.service.findAll(queryParams);
    }
  
    @Post()
    @Permissions('exporters')
    async create(@Body() payload: CreatePayload, @Request() req) {
      payload = trimObjectStrings(payload);
      if (payload.stamp) {
        const fileData = Buffer.from((payload.stamp as any).split(',')[1], 'base64');
        payload.stamp = fileData;
      }
      return this.service.create(payload, req.user.id);
    }
  
    @Delete(':id')
    @Permissions('exporters')
    async delete(@Param('id', ParseIntPipe) id: number, @Request() req) {
      const requestingUserId = req.user.id;
      return this.service.delete(id, requestingUserId);
    }
  }
