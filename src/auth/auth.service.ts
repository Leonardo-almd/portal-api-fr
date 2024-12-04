import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Email ou senha inválidos');
    }
    if(user.password) delete user.password;
    return user;
  }

  async login(email: string, password: string): Promise<{ access_token: string, user: any }> {
    const user = await this.validateUser(email, password);
    const payload = { id: user.id, email: user.email, permissions: user.permissions, is_admin: user.is_admin };
    const token = this.jwtService.sign(payload);
    return { access_token: token, user };
  }

  // async recoveryPassword(email: string): Promise<void> {
  //   const user = await this.usersService.findByEmail(email);
  //   if (!user) {
  //     throw new UnauthorizedException('Email inválido');
  //   }
  //   // send email with password recovery instructions
  // }
}

