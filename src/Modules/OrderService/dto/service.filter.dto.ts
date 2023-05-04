import {IsOptional} from 'class-validator'

export class ServiceFilterDto {
  @IsOptional()
  public clientName: string

  @IsOptional()
  public osNumber: string
}
