import {IsNotEmpty, IsOptional} from 'class-validator'

export class ExpenseFilterDto {
  @IsNotEmpty({message: 'Expense is required'})
  @IsOptional()
  public expense: string
}
