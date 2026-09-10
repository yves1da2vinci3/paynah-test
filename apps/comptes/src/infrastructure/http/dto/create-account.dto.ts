import { IsInt, IsOptional, IsString, IsUUID, Length, Min } from 'class-validator';

export class CreateAccountDto {
  @IsUUID()
  userId!: string;

  @IsString()
  @Length(3, 3)
  currency!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  initialBalanceMinor?: number;
}
