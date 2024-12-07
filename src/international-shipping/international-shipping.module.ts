import { Module } from '@nestjs/common';
import { InternationalShippingController } from './international-shipping.controller';
import { InternationalShippingService } from './international-shipping.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { Customer } from 'src/entities/customer.entity';
import { Branch } from 'src/entities/branch.entity';
import { Process } from 'src/entities/process.entity';
import { InternationalShipping } from 'src/entities/international-shipping.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Customer, Branch, Process, InternationalShipping])],
  controllers: [InternationalShippingController],
  providers: [InternationalShippingService]
})
export class InternationalShippingModule {}
