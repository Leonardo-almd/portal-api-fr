import { Controller, Delete, Get, Param, ParseIntPipe, Query, UseGuards, Request, Body, Post } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BranchService } from './branch.service';
import { trimObjectStrings } from 'src/helpers/helpers';
import { Branch } from 'src/entities/branch.entity';

type CreatePayload = Omit<Branch, 'created_at' | 'updated_at' | 'deleted_at'>;

@UseGuards(AuthGuard('jwt'))
@Controller('branch')
export class BranchController {
  constructor(private readonly service: BranchService) {}

  @Get('quicksearch')
  async quickSearch(@Query('value') filter: string) {
    filter === 'undefined' || filter === 'null' ? filter = null : filter;
    return this.service.quickSearch(filter?.trim());
  }

  @Get()
  async findAll(@Query('page', ParseIntPipe) page: number = 1, @Query('pageSize', ParseIntPipe) pageSize: number = 10, @Query('search') search: string) {
    const queryParams = { page: Number(page), pageSize: Number(pageSize), search: search?.trim() };
    return this.service.findAll(queryParams);
  }

  @Post()
  async create(@Body() payload: CreatePayload, @Request() req) {
    payload = trimObjectStrings(payload);
    return this.service.create(payload, req.user.id);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const requestingUserId = req.user.id;
    return this.service.delete(id, requestingUserId);
  }
}
