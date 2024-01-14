import {Prop, Schema, SchemaFactory} from '@nestjs/mongoose'
import {Document} from 'mongoose'

export type ModelDocument = Model & Document

@Schema()
export class Model {
  @Prop()
  public description: string
}

export const ModelSchema = SchemaFactory.createForClass(Model)
