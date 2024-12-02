// src/users/users.controller.ts
import { Controller, Get, Delete, Param, Body, Patch, Request, UseGuards, Post, Query, ParseIntPipe } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '@nestjs/passport';
import { trimObjectStrings } from 'src/helpers/helpers';
import { User } from 'src/entities/user.entity';

type CreatePayload = Omit<User, 'created_at' | 'updated_at' | 'deleted_at'>;

@UseGuards(AuthGuard('jwt'))
@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async listUsers(@Query('page', ParseIntPipe) page: number = 1, @Query('pageSize', ParseIntPipe) pageSize: number = 10, @Query('search') search: string) {
    const queryParams = { page: Number(page), pageSize: Number(pageSize), search: search?.trim() };
    return this.usersService.findAll(queryParams);

  }

  @Delete(':id')
  async deleteUser(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const requestingUserId = req.user.id;
    return this.usersService.deleteUser(id, requestingUserId);
  }

  @Patch(':id/role')
  async toggleUserRole(@Param('id', ParseIntPipe) id: number, @Body('currentRole') currentRole: boolean, @Request() req) {
    const requestingUserId = req.user.id;
    return this.usersService.toggleUserRole(id, currentRole, requestingUserId);
  }

  @Patch(':id/reset-password')
  async resetPassword(@Param('id', ParseIntPipe) id: number, @Body('password') password: string, @Request() req) {
    const requestingUserId = req.user.id;
    return this.usersService.resetPassword(id, password, requestingUserId);
  }

  @Post()
  async createUser(@Body() payload: CreatePayload, @Request() req) {
    payload = trimObjectStrings(payload)
    return this.usersService.createUser(payload, req.user.id);
  }
}
