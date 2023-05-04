import {IsNotEmpty, IsNumber} from 'class-validator'

export class PieceDto {
  @IsNotEmpty({message: 'Description is required'})
  public description: string

  @IsNumber()
  public value: number
}
