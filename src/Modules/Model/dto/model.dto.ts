import {IsNotEmpty} from 'class-validator'

export class ModelDto {
  @IsNotEmpty({message: 'Description is required'})
  public description: string
}
