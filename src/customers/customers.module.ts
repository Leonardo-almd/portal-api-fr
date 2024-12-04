import { Module } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { Customer } from 'src/entities/customer.entity';
import { User } from 'src/entities/user.entity';
import { CustomersController } from './customers.controller';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Customer, User])],
    controllers: [CustomersController],
    providers: [CustomersService],
    exports: [CustomersService],
})
export class CustomersModule {}
