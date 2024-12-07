import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
  } from 'typeorm';
  import { Customer } from './customer.entity';
  import { Branch } from './branch.entity';
  import { Process } from './process.entity';
import { User } from './user.entity';
  
  @Entity('international_shipping')
  export class InternationalShipping {
    @PrimaryGeneratedColumn()
    id: number;

    // Relacionamento com a entidade Customer (Cliente)
    @ManyToOne(() => Customer, { eager: true, nullable: false })
    @JoinColumn({ name: 'customer_id' })
    customer: Customer;

    // Relacionamento com a entidade Branch (Filial)
    @ManyToOne(() => Branch, { eager: true, nullable: false })
    @JoinColumn({ name: 'branch_id' })
    branch: Branch;

    // Relacionamento com a entidade Process (Processo)
    @ManyToOne(() => Process, { eager: true, nullable: false })
    @JoinColumn({ name: 'process_id' })
    process: Process;

    @Column({ type: 'date' })
    departure_date: Date; // Data de Saída

    @Column({ type: 'date', nullable: true })
    arrival_date: Date; // Data de Atracação (opcional)

    @Column()
    ship_name: string; // Nome do Navio

    @Column()
    voyage_number: string; // Número da Viagem

    @Column()
    freight_type: string; // Tipo de Frete (Prepaid, Collect)

    @Column({ type: 'date' })
    return_deadline: Date; // Data limite para devolução

    @Column()
    container: string; // Informações do Container

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    demurrage_fee: number; // Diária de Demurrage (se aplicável)

    @Column({ type: 'simple-json', nullable: true })
    freight_charges: { description: string; amount: number; item: number; currency: string; currency_rate: number; }[];

    @CreateDateColumn({ type: 'timestamp' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updated_at: Date;

    @DeleteDateColumn({ type: 'timestamp', nullable: true })
    deleted_at: Date | null;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'createdBy' })
    createdBy: User;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'updatedBy' })
    updatedBy: User;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'deletedBy' })
    deletedBy: User;
  }
  