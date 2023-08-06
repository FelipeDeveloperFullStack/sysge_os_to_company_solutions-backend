import {IsBoolean, IsOptional, IsString} from 'class-validator'
import {ClientT, ItemPieces, ItemServices, Laudo} from './type'

export class ServiceDto {
  @IsOptional()
  @IsString()
  public status: string

  @IsOptional()
  @IsString()
  public typeDocument: string

  @IsOptional()
  @IsString()
  public formOfPayment: string

  @IsOptional()
  @IsString()
  public osNumber: string

  @IsOptional()
  @IsString()
  public dateOS: string

  @IsOptional()
  @IsString()
  public dateGeneratedOS: string

  @IsOptional()
  @IsString()
  public equipament: string

  @IsOptional()
  @IsString()
  public brand: string

  @IsOptional()
  @IsString()
  public model: string

  @IsOptional()
  @IsString()
  public serialNumber: string

  @IsOptional()
  @IsString()
  public cable: string

  @IsOptional()
  @IsString()
  public charger: string

  @IsOptional()
  @IsString()
  public breaked: string

  @IsOptional()
  @IsString()
  public detail: string

  @IsOptional()
  public client: ClientT

  @IsOptional()
  public itemServices: ItemServices[]

  @IsOptional()
  public laudos: Laudo[]

  @IsOptional()
  public itemPieces: ItemPieces[]

  @IsOptional()
  @IsString()
  public manpower: string

  @IsOptional()
  @IsString()
  public discount: string

  @IsOptional()
  @IsString()
  public subTotal: string

  @IsOptional()
  @IsString()
  public total: string

  @IsOptional()
  @IsString()
  public valuePartial?: string

  @IsOptional()
  @IsString()
  public remainingValue?: string

  @IsOptional()
  public user: string

  @IsOptional()
  public maturityOfTheBoleto: string

  @IsOptional()
  @IsString()
  public idFileCreatedGoogleDrive: string

  @IsOptional()
  @IsBoolean()
  public isSendThreeDayMaturityBoleto: boolean

  @IsOptional()
  @IsBoolean()
  public isSendNowDayMaturityBoleto: boolean

  @IsOptional()
  @IsBoolean()
  public isBoletoUploaded: boolean

  @IsOptional()
  @IsBoolean()
  public isPartial?: boolean
}
