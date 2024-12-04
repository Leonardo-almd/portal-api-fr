import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Process } from 'src/entities/process.entity';
import { User } from 'src/entities/user.entity';
import { ProcessesController } from './processes.controller';
import { ProcessesService } from './processes.service';

@Module({
    imports: [TypeOrmModule.forFeature([Process, User])],
    controllers: [ProcessesController],
    providers: [ProcessesService],
    exports: [ProcessesService],
})
export class ProcessesModule {}
