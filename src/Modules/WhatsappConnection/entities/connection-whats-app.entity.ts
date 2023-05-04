import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

export type ConnectionWhatsAppDocument = ConnectionWhatsApp & Document

@Schema()
export class ConnectionWhatsApp {
  @Prop()
  public greetingMessage: string

  @Prop()
  public connectionName: string

  @Prop()
  public queue: string

  @Prop()
  public defaultNumber: boolean

  @Prop({ default: '' })
  public status: string

  @Prop({ default: 'disconnected' })
  public session: string

  @Prop({ default: '' })
  public lastUpdate: string
}

export const ConenctionWhatsAppSchema =
  SchemaFactory.createForClass(ConnectionWhatsApp)
