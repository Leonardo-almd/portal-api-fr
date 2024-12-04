import { Permission } from 'src/entities/permission.entity';
import { DataSource } from 'typeorm';

export class PermissionSeeder {
  public static async seed(dataSource: DataSource): Promise<void> {
    const permissionRepository = dataSource.getRepository(Permission);

    const permissions = [
      { entity: 'customers', label: 'Clientes' },
      { entity: 'invoice', label: 'Invoices' },
      { entity: 'branches', label: 'Filiais' },
      { entity: 'processes', label: 'Processos' },
      { entity: 'users', label: 'Usuários' },
    ];

    for (const permission of permissions) {
      const exists = await permissionRepository.findOneBy({
        entity: permission.entity,
      });

      if (!exists) {
        await permissionRepository.save(permission);
      }
    }
  }
}
