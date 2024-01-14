import {IsOptional, IsString} from 'class-validator'

export class ExtractNubankFilterDto {
  @IsOptional()
  @IsString()
  public dateIn: string

  @IsOptional()
  @IsString()
  public value: string

  @IsOptional()
  @IsString()
  public id: string

  @IsOptional()
  @IsString()
  public description: string
}
