import {IsOptional} from 'class-validator'

export class ServicePartialPaymentDto {
  @IsOptional()
  public id: string

  @IsOptional()
  public maturity: string

  @IsOptional()
  public paymentForm: string

  @IsOptional()
  public remainingPaymentForm: string

  @IsOptional()
  public remainingValue: string

  @IsOptional()
  public valuePartial: string

  @IsOptional()
  public user: string
}
