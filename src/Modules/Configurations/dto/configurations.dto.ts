import {IsBoolean, IsOptional} from 'class-validator'

export class ConfigurationSystemDto {
  @IsOptional()
  @IsBoolean()
  public isEnableWhatsappBilling: boolean

  @IsOptional()
  @IsBoolean()
  public isEnableEmailBilling: boolean
}
