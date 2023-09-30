import {IsOptional, IsString} from 'class-validator'

export class ExpenselDto {
  @IsString()
  @IsOptional()
  public expense: string

  @IsString()
  @IsOptional()
  public expense_type?: string

  @IsString()
  @IsOptional()
  public idNubank: string

  @IsString()
  @IsOptional()
  public value: string

  @IsOptional()
  public user: string

  @IsString()
  @IsOptional()
  public dateIn: string

  @IsString()
  @IsOptional()
  public maturity: string

  @IsString()
  @IsOptional()
  public status: string
}
