import {Prop, Schema, SchemaFactory} from '@nestjs/mongoose'
import {Document} from 'mongoose'

export type ExtractNubankDocument = ExtractNubank & Document

@Schema()
export class ExtractNubank {
  @Prop()
  public dateIn: string
  @Prop()
  public value: string
  @Prop()
  public id: string
  @Prop()
  public description: string
  @Prop()
  public isIncomeDownloaded?: boolean
}

export const ExtractNubankSchema = SchemaFactory.createForClass(ExtractNubank)
