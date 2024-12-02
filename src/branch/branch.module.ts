import { Module } from '@nestjs/common';
import { BranchService } from './branch.service';
import { BranchController } from './branch.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Branch } from 'src/entities/branch.entity';
import { User } from 'src/entities/user.entity';

@Module({
imports: [TypeOrmModule.forFeature([Branch, User])],
controllers: [BranchController],
providers: [BranchService],
exports: [BranchService],
})
export class BranchModule {}
