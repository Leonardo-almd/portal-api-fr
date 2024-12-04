// src/invoices/invoices.service.ts
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { db, adm } from '../firebase/firebase.config';
import * as XLSX from 'xlsx';
import * as path from 'path';
import * as ejs from 'ejs';
import * as fs from 'fs';
import { Invoice } from 'src/entities/invoice.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { InvoiceItem } from 'src/entities/invoice-item.entity';
import { Repository } from 'typeorm';
import { User } from 'src/entities/user.entity';

type CreateInvoicePayload = Omit<
  Invoice,
  'created_at' | 'updated_at' | 'deleted_at'
>;
type CreateInvoiceItemPayload = Omit<InvoiceItem, 'id'>;

@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(Invoice) private readonly repository: Repository<Invoice>,
    @InjectRepository(InvoiceItem)
    private readonly itemRepository: Repository<InvoiceItem>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  async createInvoice(
    file: Express.Multer.File,
    payload: CreateInvoicePayload,
    requestingUserId: number,
  ): Promise<Invoice> {
    try {
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const sheet = workbook.Sheets['FOB'];
      if (!sheet) {
        throw new Error('Planilha não encontrada no arquivo Excel.');
      }

      const data: any[] = XLSX.utils.sheet_to_json(sheet);

      let invoice: CreateInvoicePayload = this.repository.create({
        ...payload,
        createdBy: await this.userRepository.findOne({
          where: { id: requestingUserId },
        }),
      });

      const savedInvoice = await this.repository.save(invoice);

      // Adiciona os produtos
      const products: InvoiceItem[] = [];
      for (let i = 1; i < data.length; i++) {
        if (data[i].__EMPTY_1 === undefined) {
          continue;
        }

        const body: CreateInvoiceItemPayload = {
          ref: data[i].__EMPTY_1,
          desc: data[i].__EMPTY_2,
          qtd: data[i].__EMPTY_3,
          unit: data[i].__EMPTY_4,
          total: data[i].__EMPTY_5,
          ncm: data[i].__EMPTY_6,
          cxs: data[i].__EMPTY_7,
          pb: data[i].__EMPTY_8,
          pl: data[i].__EMPTY_9,
          invoice: savedInvoice,
        };

        const product = this.itemRepository.create(body);

        products.push(product);
      }

      await this.itemRepository.save(products);
      savedInvoice.items = products;

      return await this.repository.save(savedInvoice);
    } catch (error) {
      throw new Error(`Erro ao processar arquivo Excel: ${error.message}`);
    }
  }

  async findAll({
    page = 1,
    pageSize = 10,
    search,
  }: {
    page?: number;
    pageSize?: number;
    search?: string;
  }): Promise<{ data: Invoice[]; total: number; hasNext: boolean }> {
    const query = this.repository
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.items', 'items')
      .leftJoinAndSelect('invoice.branch', 'branch')
      .where('invoice.deleted_at IS NULL');

    if (search) {
      query.andWhere(
        '(CAST(invoice.id AS TEXT) ILIKE :search OR branch.name ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const [data, total] = await query
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    const hasNext = page * pageSize < total;

    const result = data.map((invoice) => ({
      ...invoice,
      itemsCount: invoice.items.length
    }));

    return {
      data: result,
      total,
      hasNext,
    };
  }

  async exportInvoice(invoiceId: any) {
    const invoice = await this.repository.findOne({
      where: { id: invoiceId },
      relations: ['items', 'branch'],
    })

    const template = fs.readFileSync(
      path.join(__dirname, '../templates', 'invoice.ejs'),
      'utf-8',
    );
    return ejs.render(template, invoice);
  }

  async delete(id: number, requestingUserId: number) {
    const requestingUser = await this.userRepository.findOne({ where: { id: requestingUserId } });

     const invoice = await this.repository.findOne({ where: { id } });
 
     if (!invoice) {
       throw new NotFoundException(`Invoice com id ${id} não encontrado.`);
     }
     invoice.deletedBy = requestingUser;
     await this.repository.softRemove(invoice);
     return this.repository.save(invoice);
  }
}
