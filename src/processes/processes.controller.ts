import { Body, Controller, Get, ParseIntPipe, Post, Query, UseGuards, Request, Delete, Param} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Process } from 'src/entities/process.entity';
import { trimObjectStrings } from 'src/helpers/helpers';
import { ProcessesService } from './processes.service';
import { PermissionsGuard } from 'src/guards/permissions.guard';
import { Permissions } from '../decorators/permissions.decorator';

type CreatePayload = Omit<Process, 'created_at' | 'updated_at' | 'deleted_at'>;

@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Controller('api/process')
export class ProcessesController {
    constructor(private readonly service: ProcessesService) {}

  @Get('quicksearch')
  @Permissions('processes')
  async quickSearch(@Query('value') filter: string) {
    filter === 'undefined' || filter === 'null' ? filter = null : filter;
    return this.service.quickSearch(filter?.trim());
  }

  @Get()
  @Permissions('processes')
  async findAll(@Query('page', ParseIntPipe) page: number = 1, @Query('pageSize', ParseIntPipe) pageSize: number = 10, @Query('search') search: string) {
    const queryParams = { page: Number(page), pageSize: Number(pageSize), search: search?.trim() };
    return this.service.findAll(queryParams);
  }

  @Post()
  @Permissions('processes')
  async create(@Body() payload: CreatePayload, @Request() req) {
    payload = trimObjectStrings(payload);
    return this.service.create(payload, req.user.id);
  }

  @Delete(':id')
  @Permissions('processes')
  async delete(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const requestingUserId = req.user.id;
    return this.service.delete(id, requestingUserId);
  }
}
