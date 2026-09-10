import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Wallet } from './wallet.entity.js';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 320, unique: true })
  email!: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @OneToMany(() => Wallet, (w) => w.user)
  wallets!: Wallet[];
}
