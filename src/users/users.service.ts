// src/users/users.service.ts
import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { User } from 'src/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Permission } from 'src/entities/permission.entity';

type CreateUserPayload = Omit<User, 'created_at' | 'updated_at' | 'deleted_at'>;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Permission)
    private readonly permissionsRepository: Repository<Permission>
  ) {}

  async createUser(
    payload: CreateUserPayload,
    requestingUserId: number,
  ): Promise<User> {
    if (payload.id) {
      delete payload.password;
      const user = await this.userRepository.findOne({
        where: { id: payload.id },
      });
      if (user) {
        Object.assign(user, payload);
        user.updatedBy = await this.userRepository.findOne({
          where: { id: requestingUserId },
        });
        return this.userRepository.save(user);
      }
    }
    payload.password = await bcrypt.hash(payload.password, 10);
    const user = this.userRepository.create(payload);
    const allPermissions = await this.permissionsRepository.find();
    user.permissions = allPermissions;
    user.createdBy = await this.userRepository.findOne({
      where: { id: requestingUserId },
    });
    return this.userRepository.save(user);
  }

  async getUserPermissions(userId: number): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['permissions'], 
    });

    if (!user) {
      throw new NotFoundException(`Usuário com ID ${userId} não encontrado.`);
    }

    return user.permissions;
  }

  async resetPassword(id: number, password: string, requestingUserId: number) {
    const requestingUser = await this.userRepository.findOne({
      where: { id: requestingUserId },
    });

    if (!requestingUser || !requestingUser.is_admin) {
      throw new ForbiddenException(
        'Você não tem permissão para alterar a senha do usuário.',
      );
    }

    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`Usuário com id ${id} não encontrado.`);
    }

    user.updatedBy = requestingUser;
    user.password = await bcrypt.hash(password, 10);
    return this.userRepository.save(user);
  }

  async findAll({
    page = 1,
    pageSize = 10,
    search,
  }: {
    page?: number;
    pageSize?: number;
    search?: string;
  }): Promise<{ data: User[]; total: number; hasNext: boolean }> {
    const query = this.userRepository
      .createQueryBuilder('user')
      .where('user.deleted_at IS NULL');

    if (search) {
      query.andWhere(
        '(user.name ILIKE :search OR CAST(user.id AS TEXT) ILIKE :search OR user.email ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    query.orderBy('user.updated_at', 'DESC');

    const [data, total] = await query
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    const hasNext = page * pageSize < total;

    return {
      data,
      total,
      hasNext,
    };
  }

  async findByEmail(email: string): Promise<User> {
    return this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password') 
      .leftJoinAndSelect('user.permissions', 'permissions')
      .where('user.email = :email', { email })
      .andWhere('user.deleted_at IS NULL')
      .getOne();
  }

  async deleteUser(id: number, requestingUserId: number) {
    const requestingUser = await this.userRepository.findOne({
      where: { id: requestingUserId },
    });

    if (!requestingUser || !requestingUser.is_admin) {
      throw new ForbiddenException(
        'Você não tem permissão para excluir usuários.',
      );
    }

    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`Usuário com id ${id} não encontrado.`);
    }

    user.deletedBy = requestingUser;
    await this.userRepository.softRemove(user);
    return this.userRepository.save(user);
  }

  async toggleUserRole(
    id: number,
    currentRole: boolean,
    requestingUserId: number,
  ) {
    const requestingUser = await this.userRepository.findOne({
      where: { id: requestingUserId },
    });

    if (!requestingUser || !requestingUser.is_admin) {
      throw new ForbiddenException(
        'Você não tem permissão para alterar a permissão do usuário.',
      );
    }

    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`Usuário com id ${id} não encontrado.`);
    }

    user.updatedBy = requestingUser;
    user.is_admin = currentRole;
    return this.userRepository.save(user);
  }

  async updateUserPermissions(userId: number, permissions: { entity: string; label: string; enable: boolean }[], requestingUserId: number): Promise<void> {
    const requestingUser = await this.userRepository.findOne({
      where: { id: requestingUserId },
    });

    if (!requestingUser || !requestingUser.is_admin) {
      throw new ForbiddenException(
        'Você não tem permissão para alterar a permissão do usuário.',
      );
    }

    const user = await this.userRepository.findOne({ where: { id: userId }, relations: ['permissions'] });
  
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
  
    const newPermissions = await Promise.all(
      permissions
        .filter(p => p.enable)
        .map(async p => {
          const permission = await this.permissionsRepository.findOne({
            where: { entity: p.entity },
          });
          if (!permission) {
            throw new NotFoundException(
              `Permissão com a entidade '${p.entity}' não encontrada.`,
            );
          }
          return permission;
        }),
    );
  
    user.permissions = newPermissions;
  
    await this.userRepository.save(user);
  }
  
}
