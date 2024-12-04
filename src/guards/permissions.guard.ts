import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Recupera as permissões necessárias da rota (metadata)
    const requiredPermissions = this.reflector.get<string[]>('permissions', context.getHandler());
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true; // Nenhuma permissão necessária, permite o acesso
    }

    // Recupera o usuário do objeto request
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user && !user.permissions) {
      throw new ForbiddenException('Usuário não autenticado ou sem permissões atribuídas.');
    }

    if(user && user.is_admin){
        return true
    }
    // Verifica se o usuário possui todas as permissões necessárias
    const hasPermission = requiredPermissions.every(permission =>
      user.permissions.some(userPermission => userPermission.entity === permission),
    );

    if (!hasPermission) {
      throw new ForbiddenException('Permissões insuficientes para acessar este recurso.');
    }

    return true;
  }
}
