import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Min,
} from 'class-validator';

export class CreateTransactionDto {
  @IsString()
  @Length(1, 128)
  operationId!: string;

  @IsOptional()
  @IsUUID()
  eventId?: string;

  @IsOptional()
  @IsUUID()
  paymentId?: string;

  @IsUUID()
  accountId!: string;

  @IsUUID()
  walletId!: string;

  @IsOptional()
  @IsUUID()
  counterpartyWalletId?: string;

  @IsIn(['CREDIT', 'DEBIT', 'TRANSFER'])
  direction!: 'CREDIT' | 'DEBIT' | 'TRANSFER';

  @IsInt()
  @Min(1)
  amountMinor!: number;

  @IsString()
  @Length(3, 3)
  currency!: string;

  @IsString()
  @Length(1, 32)
  status!: string;

  @IsOptional()
  @IsUUID()
  correlationId?: string;

  @IsDateString()
  occurredAt!: string;
}
