import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AccountsService } from '../../application/accounts.service.js';
import { CreateAccountDto } from './dto/create-account.dto.js';
import { CreateUserDto } from './dto/create-user.dto.js';

@Controller()
export class AccountsController {
  constructor(private readonly accounts: AccountsService) {}

  @Post('users')
  createUser(@Body() dto: CreateUserDto) {
    return this.accounts.createUser(dto.email);
  }

  @Post('accounts')
  createAccount(@Body() dto: CreateAccountDto) {
    return this.accounts.createAccount(dto);
  }

  @Get('accounts/:id/balance')
  getBalance(@Param('id') id: string) {
    return this.accounts.getBalance(id);
  }
}
