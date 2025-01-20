import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { InvoiceItem } from './invoice-item.entity';
import { Customer } from './customer.entity';
import { Exporter } from './exporter.entity';

@Entity('invoice')
export class Invoice {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Exporter)
  @JoinColumn({ name: 'exporter' })
  exporter: Exporter;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'import_customer' })
  import_customer: Customer;

  @ManyToOne(() => Customer, {nullable: true})
  @JoinColumn({ name: 'buyer_customer' })
  buyer_customer: Customer | string;

  @Column()
  number: string;

  @Column({ type: 'date' })
  date: Date; // Data limite para devolução

  @Column()
  from: string;

  @Column()
  to: string;

  @Column()
  model_transport: string;

  @Column()
  kind_package: string;

  @Column()
  payment: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, transformer: {
    to: (value: any) => (value === '' ? null : Number(value)), 
    from: (value: any) => (value === '' ? null : Number(value)), 
  }})
  shipping_value: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, transformer: {
    to: (value: any) => (value === '' ? null : Number(value)), 
    from: (value: any) => (value === '' ? null : Number(value)), 
  }})
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, transformer: {
    to: (value: any) => (value === '' ? null : Number(value)), 
    from: (value: any) => (value === '' ? null : Number(value)), 
  }})
  total: number;

  @Column()
  beneficiary_name: string;

  @Column()
  beneficiary_address: string;

  @Column()
  bank_name: string;

  @Column()
  bank_address: string;

  @Column()
  account_number: string;

  @Column()
  swift: string;

  @Column()
  bank_code: string;

  @OneToMany(() => InvoiceItem, (item) => item.invoice, { cascade: true, onDelete: 'CASCADE' })
  items: InvoiceItem[];

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
