import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Process } from 'src/entities/process.entity';
import { User } from 'src/entities/user.entity';
import { Repository } from 'typeorm';

type CreatePayload = Omit<Process, 'created_at' | 'updated_at' | 'deleted_at'>;

@Injectable()
export class ProcessesService {
  constructor(
    @InjectRepository(Process)
    private readonly repository: Repository<Process>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(
    payload: CreatePayload,
    requestingUserId: number,
  ): Promise<Process> {
    let process;
    if (payload.id) {
      process = await this.repository.findOne({ where: { id: payload.id } });
      if (process) {
        Object.assign(process, payload);
        process.updatedBy = await this.userRepository.findOne({
          where: { id: requestingUserId },
        });
        return this.repository.save(process);
      }
    }
    process = this.repository.create(payload);
    process.createdBy = await this.userRepository.findOne({
      where: { id: requestingUserId },
    });
    return this.repository.save(process);
  }

  async quickSearch(search: string = null) {
    const query = this.repository
      .createQueryBuilder('process')
      .select(['process.id', 'process.name']) // Seleciona apenas os campos necessários
      .where('process.deleted_at IS NULL')
      .take(10);

    if (search) {
      query.andWhere(
        '(CAST(process.id AS TEXT) ILIKE :search OR process.name ILIKE :search OR process.importer ILIKE :search OR process.exporter ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const processes = await query.getMany(); // Obtém os resultados

    // Mapeia para o formato desejado
    return processes.map((process) => ({
      value: process.id,
      label: process.name,
    }));
  }

  async findAll({
    page = 1,
    pageSize = 10,
    search,
  }: {
    page?: number;
    pageSize?: number;
    search?: string;
  }): Promise<{ data: Process[]; total: number; hasNext: boolean }> {
    const query = this.repository
      .createQueryBuilder('process')
      .where('process.deleted_at IS NULL');

    if (search) {
      query.andWhere(
        '(CAST(process.id AS TEXT) ILIKE :search OR process.name ILIKE :search OR process.exporter ILIKE :search OR process.importer ILIKE :search OR process.bl ILIKE :search OR process.destinationHarbor ILIKE :search OR process.originHarbor ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    query.orderBy('process.updated_at', 'DESC');

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
    const requestingUser = await this.userRepository.findOne({
      where: { id: requestingUserId },
    });

    const process = await this.repository.findOne({ where: { id } });

    if (!process) {
      throw new NotFoundException(`Processo com id ${id} não encontrado.`);
    }
    process.deletedBy = requestingUser;
    await this.repository.softRemove(process);
    return this.repository.save(process);
  }
}
