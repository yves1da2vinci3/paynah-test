import { IsInt, IsString, Length, Min } from 'class-validator';

export class LedgerMutationDto {
  @IsInt()
  @Min(1)
  amountMinor!: number;

  @IsString()
  @Length(3, 3)
  currency!: string;

  @IsString()
  operationId!: string;
}
