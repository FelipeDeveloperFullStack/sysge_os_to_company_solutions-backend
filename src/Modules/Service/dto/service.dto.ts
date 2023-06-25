import {IsNotEmpty, IsNumber, IsOptional} from 'class-validator'

export class ServiceDto {
  @IsNotEmpty({message: 'Description is required'})
  public description: string

  @IsOptional()
  public laudos: string[]

  @IsNumber()
  @IsOptional()
  public value: number

  @IsOptional()
  public user: string
}
