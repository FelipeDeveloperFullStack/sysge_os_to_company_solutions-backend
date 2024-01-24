import {IsBoolean, IsOptional} from 'class-validator'

export class ConfigurationSystemDto {
  @IsOptional()
  @IsBoolean()
  public isEnableToDontShowBeforeYearCurrent: boolean

  @IsOptional()
  @IsBoolean()
  public isEnableEmailBilling: boolean
}
