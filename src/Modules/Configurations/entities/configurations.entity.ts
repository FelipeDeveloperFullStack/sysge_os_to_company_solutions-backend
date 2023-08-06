import {Prop, Schema, SchemaFactory} from '@nestjs/mongoose'
import {Document} from 'mongoose'

export type ConfigurationSystemDocument = ConfigurationSystem & Document

@Schema()
export class ConfigurationSystem {
  @Prop()
  public isEnableWhatsappBilling: boolean

  @Prop()
  public isEnableEmailBilling: boolean
}

export const ConfigurationSystemSchema =
  SchemaFactory.createForClass(ConfigurationSystem)
