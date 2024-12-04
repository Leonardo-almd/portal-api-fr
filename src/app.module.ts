import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { InvoicesModule } from './invoices/invoices.module';
import { AuthModule } from './auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BranchModule } from './branch/branch.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ProcessesController } from './processes/processes.controller';
import { ProcessesService } from './processes/processes.service';
import { ProcessesModule } from './processes/processes.module';
import { CustomersController } from './customers/customers.controller';
import { CustomersModule } from './customers/customers.module';

@Module({
  imports: [UsersModule, InvoicesModule, AuthModule, 
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DATABASE_HOST'),
        port: configService.get<number>('DATABASE_PORT'),
        username: configService.get<string>('DATABASE_USER'),
        password: configService.get<string>('DATABASE_PASSWORD'),
        database: configService.get<string>('DATABASE_NAME'),
        autoLoadEntities: true, // Carrega as entidades automaticamente
        synchronize: true,      // Não use em produção!
      }),
    }),
    BranchModule,
    ConfigModule.forRoot({
      isGlobal: true, // Torna o ConfigModule acessível em toda a aplicação
    }),
    ProcessesModule,
    CustomersModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
