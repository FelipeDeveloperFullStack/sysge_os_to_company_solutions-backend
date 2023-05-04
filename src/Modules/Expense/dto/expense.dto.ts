import {IsNotEmpty, IsString} from 'class-validator'

export class ExpenselDto {
  @IsNotEmpty({message: 'Expense is required'})
  @IsString()
  public expense: string

  @IsNotEmpty({message: 'Value is required'})
  @IsString()
  public value: string

  @IsNotEmpty({message: 'Date is required'})
  @IsString()
  public dateIn: string

  @IsNotEmpty({message: 'Status is required'})
  @IsString()
  public status: string
}
