import {IsOptional} from 'class-validator'
import {ClientT} from './type'

export class ServiceFilterDto {
  @IsOptional()
  public clientName: string

  @IsOptional()
  public osNumber: string

  @IsOptional()
  public client: ClientT
}
