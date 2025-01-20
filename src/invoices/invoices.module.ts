import { Module } from '@nestjs/common';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { Invoice } from 'src/entities/invoice.entity';
import { InvoiceItem } from 'src/entities/invoice-item.entity';
import { Branch } from 'src/entities/branch.entity';
import { Customer } from 'src/entities/customer.entity';

@Module({
    controllers: [InvoicesController],
    imports: [MulterModule.register({
      storage: memoryStorage(),
    }),
    TypeOrmModule.forFeature([User, Invoice, InvoiceItem, Branch, Customer])
  ],
    providers: [InvoicesService]
  })
export class InvoicesModule {}
