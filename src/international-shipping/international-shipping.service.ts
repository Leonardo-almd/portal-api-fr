import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import ejs from 'ejs';
import { InternationalShipping } from 'src/entities/international-shipping.entity';
import { User } from 'src/entities/user.entity';
import { Repository } from 'typeorm';
import * as path from 'path';
import * as fs from 'fs';
import { formatCNPJ, formatCurrency, formatDate, formatPhoneNumber } from 'src/helpers/helpers';

type CreatePayload = Omit<InternationalShipping, 'created_at' | 'updated_at' | 'deleted_at'>;

@Injectable()
export class InternationalShippingService {
    constructor(
        @InjectRepository(InternationalShipping)
        private readonly repository: Repository<InternationalShipping>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>
      ) {}
    
      async create(payload: CreatePayload, requestingUserId: number ): Promise<InternationalShipping> {
        let internationalShipping;
        if(payload.id){
          internationalShipping = await this.repository.findOne({ where: { id: payload.id } });
          if(internationalShipping){
            Object.assign(internationalShipping, payload);
            internationalShipping.updatedBy = await this.userRepository.findOne({ where: { id: requestingUserId } });
            return this.repository.save(internationalShipping);
          }
        }
        internationalShipping = this.repository.create(payload);
        internationalShipping.createdBy = await this.userRepository.findOne({ where: { id: requestingUserId } });
        return this.repository.save(internationalShipping);
      }

    
      async findAll({
        page = 1,
        pageSize = 10,
        search,
      }: {
        page?: number;
        pageSize?: number;
        search?: string;
      }): Promise<{
        data: InternationalShipping[];
        total: number;
        hasNext: boolean;
      }> {
        const query = this.repository.createQueryBuilder('international_shipping')
          .leftJoinAndSelect('international_shipping.customer', 'customer') // Inclui o relacionamento com customer
          .leftJoinAndSelect('international_shipping.branch', 'branch') // Inclui o relacionamento com branch
          .leftJoinAndSelect('international_shipping.process', 'process') // Inclui o relacionamento com process
          .where('international_shipping.deleted_at IS NULL'); // Apenas itens não deletados
      
        if (search) {
          query.andWhere(
            `
            (
              CAST(international_shipping.id AS TEXT) ILIKE :search OR
              international_shipping.container ILIKE :search OR
              customer.name ILIKE :search OR
              branch.name ILIKE :search OR
              process.name ILIKE :search
            )
            `,
            { search: `%${search}%` },
          );
        }

        query.orderBy('international_shipping.updated_at', 'DESC');
      
        const [data, total] = await query
          .skip((page - 1) * pageSize) // Paginação: pula os registros das páginas anteriores
          .take(pageSize) // Limita os registros por página
          .getManyAndCount(); // Retorna os dados e o total de registros
      
        const hasNext = page * pageSize < total;
      
        return {
          data,
          total,
          hasNext,
        };
      }

      async export(id: any) {
        const internationalShipping: InternationalShipping | any = await this.repository.findOne({
          where: { id: id },
          relations: ['customer', 'branch','process'],
        })

        const logoPath = path.join(__dirname, '../assets', 'logo-falcon.jpeg');

        const logoBase64 = fs.existsSync(logoPath)
          ? `data:image/jpeg;base64,${fs.readFileSync(logoPath).toString('base64')}`
          : null;

        const template = fs.readFileSync(
          path.join(__dirname, '../templates', 'international_shipping.ejs'),
          'utf-8',
        );
        internationalShipping.logo = logoBase64
        internationalShipping.formatCNPJ = formatCNPJ;
        internationalShipping.formatDate = formatDate;
        internationalShipping.formatCurrency = formatCurrency;
        internationalShipping.formatPhone = formatPhoneNumber;
        internationalShipping.issue_date = new Date();
        return ejs.render(template, internationalShipping);
      }

      
      async delete(id: number, requestingUserId: number) {
        const requestingUser = await this.userRepository.findOne({ where: { id: requestingUserId } });
    
         const internationalShipping = await this.repository.findOne({ where: { id } });
     
         if (!internationalShipping) {
           throw new NotFoundException(`Frete internacional com id ${id} não encontrado.`);
         }
         internationalShipping.deletedBy = requestingUser;
         await this.repository.softRemove(internationalShipping);
         return this.repository.save(internationalShipping);
      }
}
