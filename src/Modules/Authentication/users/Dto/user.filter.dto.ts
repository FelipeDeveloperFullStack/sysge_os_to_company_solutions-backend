import {IsNotEmpty, IsNumber, IsOptional} from 'class-validator'

export class UserFilterDto {
  @IsNotEmpty({message: 'Name is required'})
  @IsOptional()
  public name: string
}
