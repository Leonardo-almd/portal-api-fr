import { Body, Controller, Get, ParseIntPipe, Post, Query, UseGuards, Request, Delete, Param} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Process } from 'src/entities/process.entity';
import { trimObjectStrings } from 'src/helpers/helpers';
import { Customer } from 'src/entities/customer.entity';
import { CustomersService } from './customers.service';
import { PermissionsGuard } from 'src/guards/permissions.guard';
import { Permissions } from '../decorators/permissions.decorator';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

type CreatePayload = Omit<Customer, 'created_at' | 'updated_at' | 'deleted_at'>;

@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Controller('api/customer')
export class CustomersController {
    constructor(private readonly service: CustomersService, @InjectRepository(Customer)
    private readonly repository: Repository<Customer>) {}

  @Get('quicksearch')
  @Permissions('customers')
  async quickSearch(@Query('value') filter: string) {
    filter === 'undefined' || filter === 'null' ? filter = null : filter;
    return this.service.quickSearch(filter?.trim());
  }

  @Get('quicksearch/:id')
  @Permissions('customers')
  async quickSearchById(@Param('id', ParseIntPipe) id: number) {
    const customer = await this.repository.findOne({ where: { id } });
    return {label: customer.name, value: customer.id}
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
