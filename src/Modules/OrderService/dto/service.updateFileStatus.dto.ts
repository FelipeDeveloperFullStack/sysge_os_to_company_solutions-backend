import {IsOptional, IsString} from 'class-validator'

export class ServiceUpdateFileStatusDto {
  @IsOptional()
  @IsString()
  public dateGeneratedOS: string
}
