import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../infrastructure/persistence/entities/user.entity.js';
import { Wallet } from '../infrastructure/persistence/entities/wallet.entity.js';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Wallet) private readonly wallets: Repository<Wallet>,
  ) {}

  createUser(email: string) {
    const user = this.users.create({ email });
    return this.users.save(user);
  }

  async createAccount(input: {
    userId: string;
    currency: string;
    initialBalanceMinor?: number;
  }) {
    const user = await this.users.findOne({ where: { id: input.userId } });
    if (!user) throw new NotFoundException({ code: 'NOT_FOUND' });
    const wallet = this.wallets.create({
      userId: input.userId,
      currency: input.currency,
      balanceMinor: input.initialBalanceMinor ?? 0,
    });
    return this.wallets.save(wallet);
  }

  async getBalance(walletId: string) {
    const wallet = await this.wallets.findOne({ where: { id: walletId } });
    if (!wallet) throw new NotFoundException({ code: 'NOT_FOUND' });
    return {
      walletId: wallet.id,
      balanceMinor: wallet.balanceMinor,
      currency: wallet.currency,
    };
  }
}
