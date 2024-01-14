import {IsNotEmpty, IsNumber, IsOptional} from 'class-validator'

export class PieceDto {
  @IsNotEmpty({message: 'Description is required'})
  public description: string

  @IsNumber()
  public value: number

  @IsOptional()
  public user: string
}
