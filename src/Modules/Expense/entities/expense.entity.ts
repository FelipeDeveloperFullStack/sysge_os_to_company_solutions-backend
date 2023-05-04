import {Prop, Schema, SchemaFactory} from '@nestjs/mongoose'
import {Document} from 'mongoose'

export type ModelDocument = Expense & Document

@Schema()
export class Expense {
  @Prop()
  public expense: string

  @Prop()
  public value: string

  @Prop()
  public dateIn: string

  @Prop()
  public status: string
}

export const ExpenseSchema = SchemaFactory.createForClass(Expense)
