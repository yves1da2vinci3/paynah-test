import { IsInt, IsString, IsUUID, Length, Min } from 'class-validator';

export class CreatePaymentDto {
  @IsUUID()
  sourceAccountId!: string;

  @IsUUID()
  destinationAccountId!: string;

  @IsInt()
  @Min(1)
  amountMinor!: number;

  @IsString()
  @Length(3, 3)
  currency!: string;
}
