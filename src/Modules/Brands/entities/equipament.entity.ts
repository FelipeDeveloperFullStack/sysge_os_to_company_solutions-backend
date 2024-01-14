import {Prop, Schema, SchemaFactory} from '@nestjs/mongoose'
import {Document} from 'mongoose'

export type EquipamentDocument = Equipament & Document

@Schema()
export class Equipament {
  @Prop()
  public equipamentName: string
  @Prop()
  public brand: string
  @Prop()
  public model: string
  @Prop()
  public serialNumber: string
}

export const EquipamentSchema = SchemaFactory.createForClass(Equipament)
