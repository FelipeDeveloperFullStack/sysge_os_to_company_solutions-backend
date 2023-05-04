import {IsNotEmpty, IsNumber, IsOptional} from 'class-validator'

export class ServiceFilterDto {
  @IsNotEmpty({message: 'Description is required'})
  @IsOptional()
  public description: string

  @IsOptional()
  public laudoService: string

  @IsNumber()
  @IsOptional()
  public value: number
}
