import { plainToInstance } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, Min, validateSync } from 'class-validator';

class PaiementsEnv {
  @IsInt()
  @Min(1)
  PAIEMENTS_PORT!: number;

  @IsString()
  @IsNotEmpty()
  PAIEMENTS_DB_HOST!: string;

  @IsInt()
  PAIEMENTS_DB_PORT!: number;

  @IsString()
  @IsNotEmpty()
  PAIEMENTS_DB_USER!: string;

  @IsString()
  @IsNotEmpty()
  PAIEMENTS_DB_PASSWORD!: string;

  @IsString()
  @IsNotEmpty()
  PAIEMENTS_DB_NAME!: string;

  @IsString()
  @IsNotEmpty()
  COMPTES_BASE_URL!: string;

  @IsString()
  @IsNotEmpty()
  SERVICE_TOKEN_PAIEMENTS_TO_COMPTES!: string;

  @IsString()
  @IsNotEmpty()
  RABBITMQ_URL!: string;

  @IsString()
  @IsNotEmpty()
  TRANSACTIONS_BASE_URL!: string;

  @IsString()
  @IsNotEmpty()
  USE_OUTBOX!: string;
}

export function validatePaiementsEnv(config: Record<string, unknown>) {
  const validated = plainToInstance(PaiementsEnv, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validated;
}
