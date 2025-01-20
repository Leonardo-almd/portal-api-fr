import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Exporter } from 'src/entities/exporter.entity';
import { User } from 'src/entities/user.entity';
import { Repository } from 'typeorm';

type CreatePayload = Omit<Exporter, 'created_at' | 'updated_at' | 'deleted_at'>;

@Injectable()
export class ExporterService {
    constructor(
        @InjectRepository(Exporter)
        private readonly repository: Repository<Exporter>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>
      ) {}
    
      async create(payload: CreatePayload, requestingUserId: number ): Promise<Exporter> {
        let exporter;
        if(payload.id){
          exporter = await this.repository.findOne({ where: { id: payload.id } });
          if(exporter){
            Object.assign(exporter, payload);
            exporter.updatedBy = await this.userRepository.findOne({ where: { id: requestingUserId } });
            return this.repository.save(exporter);
          }
        }
        exporter = this.repository.create(payload);
        exporter.createdBy = await this.userRepository.findOne({ where: { id: requestingUserId } });
        return this.repository.save(exporter);
      }

      async quickSearch(search: string = null) {
        const query = this.repository.createQueryBuilder('exporter')
          .select(['exporter.id', 'exporter.name']) // Seleciona apenas os campos necessários
          .where('exporter.deleted_at IS NULL')
          .take(10);
      
        if (search) {
          query.andWhere(
            '(CAST(exporter.id AS TEXT) ILIKE :search OR exporter.name ILIKE :search OR exporter.address ILIKE :search)',
            { search: `%${search}%` }
          );
        }
      
        const exporters = await query.getMany(); // Obtém os resultados
      
        // Mapeia para o formato desejado
        return exporters.map(exporter => ({
          value: exporter.id,
          label: exporter.name,
        }));
      }
      
    
      async findAll({ page = 1, pageSize = 10, search }: { page?: number; pageSize?: number; search?: string }): Promise<{ data: Exporter[]; total: number; hasNext: boolean }> {
        const query = this.repository.createQueryBuilder('exporter')
          .where('exporter.deleted_at IS NULL');
      
        if (search) {
          query.andWhere(
            '(CAST(exporter.id AS TEXT) ILIKE :search OR exporter.name ILIKE :search OR exporter.cgc ILIKE :search OR exporter.address ILIKE :search)',
            { search: `%${search}%` }
          );
        }

        query.orderBy('exporter.updated_at', 'DESC');
      
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
    
         const exporter = await this.repository.findOne({ where: { id } });
     
         if (!exporter) {
           throw new NotFoundException(`Filial com id ${id} não encontrado.`);
         }
         exporter.deletedBy = requestingUser;
         await this.repository.softRemove(exporter);
         return this.repository.save(exporter);
      }
}
