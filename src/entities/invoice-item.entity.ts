import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Invoice } from './invoice.entity';

@Entity('invoice_item')
export class InvoiceItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  ref: string;

  @Column()
  desc: string;

  @Column('int')
  qtd: string;

  @Column('decimal')
  unit: string;

  @Column('decimal')
  total: string;

  @Column({ nullable: true })
  ncm: string;

  @Column('int', { nullable: true })
  cxs: string;

  @Column('decimal', { nullable: true })
  pb: string;

  @Column('decimal', { nullable: true })
  pl: string;

  @ManyToOne(() => Invoice )
  @JoinColumn({ name: 'invoice' })
  invoice: Invoice;

}
