import {Prop, Schema, SchemaFactory} from '@nestjs/mongoose'
import {Document} from 'mongoose'

export type ServiceDocument = Service & Document

@Schema()
export class Service {
  @Prop()
  public description: string

  @Prop()
  public laudos: string[]

  @Prop()
  public value: number

  @Prop()
  public user: string
}

export const ServiceSchema = SchemaFactory.createForClass(Service)
