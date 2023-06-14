import {IsOptional} from 'class-validator'

export class DocumentChangeStatusDto {
  @IsOptional()
  public fileName: string

  @IsOptional()
  public status: string

  @IsOptional()
  public osNumber: string

  @IsOptional()
  public typeDocument: string

  @IsOptional()
  public clientName: string
}
