import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Branch } from 'src/entities/branch.entity';
import { User } from 'src/entities/user.entity';
import { Repository } from 'typeorm';

type CreatePayload = Omit<Branch, 'created_at' | 'updated_at' | 'deleted_at'>;

@Injectable()
export class BranchService {
    constructor(
        @InjectRepository(Branch)
        private readonly repository: Repository<Branch>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>
      ) {}
    
      async create(payload: CreatePayload, requestingUserId: number ): Promise<Branch> {
        let branch;
        if(payload.id){
          branch = await this.repository.findOne({ where: { id: payload.id } });
          if(branch){
            Object.assign(branch, payload);
            branch.updatedBy = await this.userRepository.findOne({ where: { id: requestingUserId } });
            return this.repository.save(branch);
          }
        }
        branch = this.repository.create(payload);
        branch.createdBy = await this.userRepository.findOne({ where: { id: requestingUserId } });
        return this.repository.save(branch);
      }

      async quickSearch(search: string = null) {
        const query = this.repository.createQueryBuilder('branch')
          .select(['branch.id', 'branch.name']) // Seleciona apenas os campos necessários
          .where('branch.deleted_at IS NULL')
          .take(10);
      
        if (search) {
          query.andWhere(
            '(CAST(branch.id AS TEXT) ILIKE :search OR branch.name ILIKE :search OR branch.cgc ILIKE :search OR branch.address ILIKE :search)',
            { search: `%${search}%` }
          );
        }
      
        const branches = await query.getMany(); // Obtém os resultados
      
        // Mapeia para o formato desejado
        return branches.map(branch => ({
          value: branch.id,
          label: branch.name,
        }));
      }
      
    
      async findAll({ page = 1, pageSize = 10, search }: { page?: number; pageSize?: number; search?: string }): Promise<{ data: Branch[]; total: number; hasNext: boolean }> {
        const query = this.repository.createQueryBuilder('branch')
          .where('branch.deleted_at IS NULL');
      
        if (search) {
          query.andWhere(
            '(CAST(branch.id AS TEXT) ILIKE :search OR branch.name ILIKE :search OR branch.cgc ILIKE :search OR branch.address ILIKE :search)',
            { search: `%${search}%` }
          );
        }
      
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
      

      async delete(id: number, requestingUserId: number) {
        const requestingUser = await this.userRepository.findOne({ where: { id: requestingUserId } });
    
         if (!requestingUser || !requestingUser.is_admin) {
           throw new ForbiddenException('Você não tem permissão para excluir filiais.');
         }
    
         const branch = await this.repository.findOne({ where: { id } });
     
         if (!branch) {
           throw new NotFoundException(`Filial com id ${id} não encontrado.`);
         }
         branch.deletedBy = requestingUser;
         await this.repository.softRemove(branch);
         return this.repository.save(branch);
      }
}
