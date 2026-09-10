import { plainToInstance } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, Min, validateSync } from 'class-validator';

class ComptesEnv {
  @IsInt()
  @Min(1)
  COMPTES_PORT!: number;

  @IsString()
  @IsNotEmpty()
  COMPTES_DB_HOST!: string;

  @IsInt()
  COMPTES_DB_PORT!: number;

  @IsString()
  @IsNotEmpty()
  COMPTES_DB_USER!: string;

  @IsString()
  @IsNotEmpty()
  COMPTES_DB_PASSWORD!: string;

  @IsString()
  @IsNotEmpty()
  COMPTES_DB_NAME!: string;

  @IsString()
  @IsNotEmpty()
  SERVICE_TOKEN_COMPTES!: string;
}

export function validateComptesEnv(config: Record<string, unknown>) {
  const validated = plainToInstance(ComptesEnv, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validated;
}
