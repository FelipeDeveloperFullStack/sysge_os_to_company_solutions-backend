import {IsOptional} from 'class-validator'

export class DocumentChangeStatusDto {
  @IsOptional()
  public id: string

  @IsOptional()
  public idFileCreatedGoogleDrive: string

  @IsOptional()
  public clientId: string

  @IsOptional()
  public typeDocument: string

  @IsOptional()
  public status: string
}
