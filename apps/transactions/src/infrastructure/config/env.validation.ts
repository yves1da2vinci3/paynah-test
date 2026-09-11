import { plainToInstance } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, Min, validateSync } from 'class-validator';

class TransactionsEnv {
  @IsInt()
  @Min(1)
  TRANSACTIONS_PORT!: number;

  @IsString()
  @IsNotEmpty()
  TRANSACTIONS_DB_HOST!: string;

  @IsInt()
  TRANSACTIONS_DB_PORT!: number;

  @IsString()
  @IsNotEmpty()
  TRANSACTIONS_DB_USER!: string;

  @IsString()
  @IsNotEmpty()
  TRANSACTIONS_DB_PASSWORD!: string;

  @IsString()
  @IsNotEmpty()
  TRANSACTIONS_DB_NAME!: string;

  @IsString()
  @IsNotEmpty()
  RABBITMQ_URL!: string;
}

export function validateTransactionsEnv(config: Record<string, unknown>) {
  const validated = plainToInstance(TransactionsEnv, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validated;
}
