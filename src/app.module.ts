import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { InvoicesModule } from './invoices/invoices.module';
import { AuthModule } from './auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BranchModule } from './branch/branch.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ProcessesModule } from './processes/processes.module';
import { CustomersModule } from './customers/customers.module';
import { InternationalShippingModule } from './international-shipping/international-shipping.module';
import { PingModule } from './ping/ping.module';
import { ExporterController } from './exporter/exporter.controller';
import { ExporterModule } from './exporter/exporter.module';

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
        autoLoadEntities: configService.get<string>('DATABASE_SYNC') === 'true', // Carrega as entidades automaticamente
        synchronize: true,      // Não use em produção!
        // logging: true,
      }),
    }),
    BranchModule,
    ConfigModule.forRoot({
      isGlobal: true, // Torna o ConfigModule acessível em toda a aplicação
    }),
    ProcessesModule,
    CustomersModule,
    InternationalShippingModule,
    PingModule,
    ExporterModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
