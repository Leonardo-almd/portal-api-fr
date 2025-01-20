// src/users/user.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('exporters')
export class Exporter {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({nullable: true})
  address: string;

  @Column({nullable: true, transformer: {
    to: (value: any) => (value === '' ? null : Number(value)), 
    from: (value: any) => value, 
  }})
  number: number;

  @Column({nullable: true})
  complement: string;

  @Column({nullable: true})
  neighborhood: string;

  @Column({nullable: true})
  city: string;

  @Column({nullable: true})
  state: string;

  @Column({nullable: true})
  country: string;

  @Column({ type: 'bytea', nullable: true}) 
  stamp: Buffer;

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
