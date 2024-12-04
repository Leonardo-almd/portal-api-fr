import { Controller, Delete, Get, Param, ParseIntPipe, Query, UseGuards, Request, Body, Post } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BranchService } from './branch.service';
import { trimObjectStrings } from 'src/helpers/helpers';
import { Branch } from 'src/entities/branch.entity';
import { PermissionsGuard } from 'src/guards/permissions.guard';
import { Permissions } from '../decorators/permissions.decorator';

type CreatePayload = Omit<Branch, 'created_at' | 'updated_at' | 'deleted_at'>;

@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Controller('api/branch')
export class BranchController {
  constructor(private readonly service: BranchService) {}

  @Get('quicksearch')
  @Permissions('customers')
  async quickSearch(@Query('value') filter: string) {
    filter === 'undefined' || filter === 'null' ? filter = null : filter;
    return this.service.quickSearch(filter?.trim());
  }

  @Get()
  @Permissions('customers')
  async findAll(@Query('page', ParseIntPipe) page: number = 1, @Query('pageSize', ParseIntPipe) pageSize: number = 10, @Query('search') search: string) {
    const queryParams = { page: Number(page), pageSize: Number(pageSize), search: search?.trim() };
    return this.service.findAll(queryParams);
  }

  @Post()
  @Permissions('customers')
  async create(@Body() payload: CreatePayload, @Request() req) {
    payload = trimObjectStrings(payload);
    return this.service.create(payload, req.user.id);
  }

  @Delete(':id')
  @Permissions('customers')
  async delete(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const requestingUserId = req.user.id;
    return this.service.delete(id, requestingUserId);
  }
}
