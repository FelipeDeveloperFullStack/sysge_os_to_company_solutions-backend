import {IsNotEmpty, IsOptional} from 'class-validator'

export class EquipamentFilterDto {
  @IsNotEmpty({message: 'equipamentName is required'})
  @IsOptional()
  public equipamentName: string

  @IsNotEmpty({message: 'brand is required'})
  @IsOptional()
  public brand: string

  @IsNotEmpty({message: 'model is required'})
  @IsOptional()
  public model: string

  @IsNotEmpty({message: 'serialNumber is required'})
  @IsOptional()
  public serialNumber: string
}
