import {IsNotEmpty, IsNumber, IsOptional} from 'class-validator'

export class PieceFilterDto {
  @IsNotEmpty({message: 'Description is required'})
  @IsOptional()
  public description: string

  @IsNumber()
  @IsOptional()
  public value: number
}
