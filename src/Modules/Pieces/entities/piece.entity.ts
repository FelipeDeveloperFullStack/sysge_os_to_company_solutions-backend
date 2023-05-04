import {Prop, Schema, SchemaFactory} from '@nestjs/mongoose'
import {Document} from 'mongoose'

export type PieceDocument = Piece & Document

@Schema()
export class Piece {
  @Prop()
  public description: string

  @Prop()
  public value: number
}

export const PieceSchema = SchemaFactory.createForClass(Piece)
