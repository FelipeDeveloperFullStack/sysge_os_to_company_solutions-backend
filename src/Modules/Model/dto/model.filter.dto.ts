import {IsNotEmpty, IsOptional} from 'class-validator'

export class ModelFilterDto {
  @IsNotEmpty({message: 'Description is required'})
  @IsOptional()
  public description: string
}
