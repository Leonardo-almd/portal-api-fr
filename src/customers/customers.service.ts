import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Customer } from 'src/entities/customer.entity';
import { User } from 'src/entities/user.entity';
import { Repository } from 'typeorm';

type CreatePayload = Omit<Customer, 'created_at' | 'updated_at' | 'deleted_at'>;

@Injectable()
export class CustomersService {
    constructor(
        @InjectRepository(Customer)
        private readonly repository: Repository<Customer>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>
      ) {}
    
      async create(payload: CreatePayload, requestingUserId: number ): Promise<Customer> {
        let customer;
        if(payload.id){
          customer = await this.repository.findOne({ where: { id: payload.id } });
          if(customer){
            Object.assign(customer, payload);
            customer.updatedBy = await this.userRepository.findOne({ where: { id: requestingUserId } });
            return this.repository.save(customer);
          }
        }
        customer = this.repository.create(payload);
        customer.createdBy = await this.userRepository.findOne({ where: { id: requestingUserId } });
        return this.repository.save(customer);
      }

      async quickSearch(search: string = null) {
        const query = this.repository.createQueryBuilder('customer')
          .select(['customer.id', 'customer.name']) // Seleciona apenas os campos necessários
          .where('customer.deleted_at IS NULL')
          .take(10);
      
        if (search) {
          query.andWhere(
            '(CAST(customer.id AS TEXT) ILIKE :search OR customer.name ILIKE :search OR customer.cgc ILIKE :search OR customer.address ILIKE :search)',
            { search: `%${search}%` }
          );
        }
      
        const customers = await query.getMany(); // Obtém os resultados
      
        // Mapeia para o formato desejado
        return customers.map(customer => ({
          value: customer.id,
          label: customer.name,
        }));
      }
      
    
      async findAll({ page = 1, pageSize = 10, search }: { page?: number; pageSize?: number; search?: string }): Promise<{ data: Customer[]; total: number; hasNext: boolean }> {
        const query = this.repository.createQueryBuilder('customer')
          .where('customer.deleted_at IS NULL');
      
        if (search) {
          query.andWhere(
            '(CAST(customer.id AS TEXT) ILIKE :search OR customer.name ILIKE :search OR customer.cgc ILIKE :search OR customer.address ILIKE :search)',
            { search: `%${search}%` }
          );
        }

        query.orderBy('customer.updated_at', 'DESC');
      
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
    
         const customer = await this.repository.findOne({ where: { id } });
     
         if (!customer) {
           throw new NotFoundException(`Cliente com id ${id} não encontrado.`);
         }
         customer.deletedBy = requestingUser;
         await this.repository.softRemove(customer);
         return this.repository.save(customer);
      }
}
