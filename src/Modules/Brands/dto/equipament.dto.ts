import {IsNotEmpty, IsOptional, IsString} from 'class-validator'

export class EquipamentDto {
  @IsNotEmpty({message: 'Description is required'})
  public equipamentName: string

  @IsNotEmpty({message: 'brand is required'})
  public brand: string

  @IsNotEmpty({message: 'model is required'})
  public model: string

  @IsOptional()
  @IsString()
  public serialNumber: string
}
