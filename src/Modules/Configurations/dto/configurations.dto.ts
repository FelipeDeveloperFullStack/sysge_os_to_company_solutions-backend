import {IsBoolean, IsOptional, IsString} from 'class-validator'

export class ConfigurationSystemDto {
  @IsOptional()
  @IsBoolean()
  public isEnableToDontShowBeforeYearCurrent: boolean

  @IsOptional()
  @IsBoolean()
  public isEnableEmailBilling: boolean

  @IsOptional()
  @IsBoolean()
  public isEnableSendNotificationMessage: boolean

  @IsOptional()
  @IsBoolean()
  public isEnableSendNotificationMessageStatusRecebido: boolean
  
  @IsOptional()
  @IsString()
  public textToSendNotificationMessageStatusRecebido: string
}
