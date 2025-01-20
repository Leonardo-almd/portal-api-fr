// src/invoices/invoices.service.ts
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as XLSX from 'xlsx';
import * as path from 'path';
import * as ejs from 'ejs';
import * as fs from 'fs';
import { Invoice } from 'src/entities/invoice.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { InvoiceItem } from 'src/entities/invoice-item.entity';
import { Repository } from 'typeorm';
import { User } from 'src/entities/user.entity';
import { formatDate } from 'src/helpers/helpers';

type CreateInvoicePayload = Omit<
  Invoice,
  'created_at' | 'updated_at' | 'deleted_at'
>;
type CreateInvoiceItemPayload = Omit<InvoiceItem, 'id' | 'deleted_at'>;

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
      let invoice;
      payload.buyer_customer == ''
        ? (payload.buyer_customer = null)
        : payload.buyer_customer;

      if (payload.id) {
        invoice = await this.repository.findOne({ where: { id: payload.id } });
        delete payload.items;
        if (invoice) {
          Object.assign(invoice, payload);
          invoice.updatedBy = await this.userRepository.findOne({
            where: { id: requestingUserId },
          });
          invoice.total = Number(invoice.subtotal) + payload.shipping_value;
          return this.repository.save(invoice);
        }
      } else {
        const workbook = XLSX.read(file.buffer, { type: 'buffer' });
        const sheet = workbook.Sheets['FOB'];
        if (!sheet) {
          throw new Error('Planilha não encontrada no arquivo Excel.');
        }

        const data: any[] = XLSX.utils.sheet_to_json(sheet);
        invoice = this.repository.create({
          ...payload,
          createdBy: await this.userRepository.findOne({
            where: { id: requestingUserId },
          }),
        });

        const savedInvoice = await this.repository.save(invoice);

        // Adiciona os produtos
        const products: InvoiceItem[] = [];
        let subtotal = 0;
        let total = Number(savedInvoice.shipping_value);
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

          subtotal += Number(body.total);
          total += Number(body.total);

          const product = this.itemRepository.create(body);

          products.push(product);
        }

        await this.itemRepository.save(products);
        savedInvoice.items = products;
        savedInvoice.subtotal = subtotal;
        savedInvoice.total = total;

        return await this.repository.save(savedInvoice);
      }
    } catch (error) {
      throw new Error(`${error.message}`);
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
      .leftJoinAndSelect('invoice.exporter', 'branch')
      .leftJoinAndSelect('invoice.buyer_customer', 'buyer_customer')
      .leftJoinAndSelect('invoice.import_customer', 'import_customer')
      .where('invoice.deleted_at IS NULL');

    if (search) {
      query.andWhere(
        '(CAST(invoice.id AS TEXT) ILIKE :search OR branch.name ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    query.orderBy('invoice.updated_at', 'DESC');

    const [data, total] = await query
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    const hasNext = page * pageSize < total;

    const result = data.map((invoice) => ({
      ...invoice,
      itemsCount: invoice.items.length,
    }));

    return {
      data: result,
      total,
      hasNext,
    };
  }

  async export(invoiceId: any, model: string, type: 'packing-list' | 'invoice') {
    const invoice: any = await this.repository.findOne({
      where: { id: invoiceId },
      relations: ['items', 'exporter', 'buyer_customer', 'import_customer'],
    });

    const exporter = model.toLowerCase();

    const template = fs.readFileSync(
      path.join(
        __dirname,
        `../templates/invoices/${exporter}`,
        `${type}.ejs`,
      ),
      'utf-8',
    );

    let stampBase64: string;
    if(exporter === 'genérico'){
      if(invoice.exporter.stamp){
        const base64String = invoice.exporter.stamp.toString('base64');
        stampBase64 = `data:image/jpeg;base64,${base64String}`;
      }
    } else {
    const stampPath = path.join(
        __dirname,
        '../assets',
        `stamp-${exporter}.png`,
      );
      stampBase64 = fs.existsSync(stampPath)
      ? `data:image/jpeg;base64,${fs.readFileSync(stampPath).toString('base64')}`
      : null;
    }
    
    

    const subLogoPath = path.join(
        __dirname,
        '../assets',
        `sublogo-${exporter}.png`,
      );
    const subLogoBase64 = fs.existsSync(subLogoPath)
        ? `data:image/jpeg;base64,${fs.readFileSync(subLogoPath).toString('base64')}`
        : null;
    const totals = invoice.items.reduce(
      (acc, item) => {
        acc.cxs += item.cxs;
        acc.pb += parseFloat(item.pb);
        acc.pl += parseFloat(item.pl);
        return acc;
      },
      { cxs: 0, pb: 0, pl: 0 }, // Valores iniciais
    );
    totals.pb = totals.pb.toFixed(2);
    totals.pl = totals.pl.toFixed(2);
    invoice.totalsQtd = totals;
    invoice.formatDate = formatDate;
    invoice.stamp = stampBase64;
    invoice.sublogo = subLogoBase64;
    return ejs.render(template, invoice);
  }

  async delete(id: number, requestingUserId: number) {
    const requestingUser = await this.userRepository.findOne({
      where: { id: requestingUserId },
    });

    const invoice = await this.repository.findOne({ where: { id }, relations: ['items'] });

    if (!invoice) {
      throw new NotFoundException(`Invoice com id ${id} não encontrado.`);
    }

    await this.itemRepository.softRemove(invoice.items);

    invoice.deletedBy = requestingUser;
    await this.repository.softRemove(invoice);
    return this.repository.save(invoice);
  }
}
