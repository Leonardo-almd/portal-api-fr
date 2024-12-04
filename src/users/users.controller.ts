// src/users/users.controller.ts
import { Controller, Get, Delete, Param, Body, Patch, Request, UseGuards, Post, Query, ParseIntPipe } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '@nestjs/passport';
import { trimObjectStrings } from 'src/helpers/helpers';
import { User } from 'src/entities/user.entity';
import { PermissionsGuard } from 'src/guards/permissions.guard';
import { Permissions } from '../decorators/permissions.decorator';

type CreatePayload = Omit<User, 'created_at' | 'updated_at' | 'deleted_at'>;

@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Permissions('users')
  async listUsers(
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('pageSize', ParseIntPipe) pageSize: number = 10,
    @Query('search') search: string,
  ) {
    const queryParams = {
      page: Number(page),
      pageSize: Number(pageSize),
      search: search?.trim(),
    };
    return this.usersService.findAll(queryParams);
  }

  @Get(':id/permissions')
  @Permissions('users')
  async getUserPermissions(@Param('id') id: number): Promise<string[]> {
    return this.usersService.getUserPermissions(id);
  }

  @Delete(':id')
  @Permissions('users')
  async deleteUser(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const requestingUserId = req.user.id;
    return this.usersService.deleteUser(id, requestingUserId);
  }

  @Patch(':id/permissions')
  @Permissions('users')
  async updatePermissions(
    @Param('id') userId: number,
    @Body('permissions')
    permissions: { entity: string; label: string; enable: boolean }[],
    @Request() req,
  ): Promise<void> {
    const requestingUserId = req.user.id;
    return this.usersService.updateUserPermissions(userId, permissions, requestingUserId);
  }

  @Patch(':id/role')
  @Permissions('users')
  async toggleUserRole(
    @Param('id', ParseIntPipe) id: number,
    @Body('currentRole') currentRole: boolean,
    @Request() req,
  ) {
    const requestingUserId = req.user.id;
    return this.usersService.toggleUserRole(id, currentRole, requestingUserId);
  }

  @Patch(':id/reset-password')
  @Permissions('users')
  async resetPassword(
    @Param('id', ParseIntPipe) id: number,
    @Body('password') password: string,
    @Request() req,
  ) {
    const requestingUserId = req.user.id;
    return this.usersService.resetPassword(id, password, requestingUserId);
  }

  @Post()
  @Permissions('users')
  async createUser(@Body() payload: CreatePayload, @Request() req) {
    payload = trimObjectStrings(payload);
    return this.usersService.createUser(payload, req.user.id);
  }
}
