import {Prop, Schema, SchemaFactory} from '@nestjs/mongoose'
import {Document} from 'mongoose'

export type ModelDocument = Expense & Document

@Schema()
export class Expense {
  @Prop()
  public expense: string

  @Prop()
  public isEnableToDontShowBeforeYearCurrent?: boolean

  @Prop()
  public expense_type?: string

  @Prop()
  public idNubank: string

  @Prop()
  public value: string

  @Prop()
  public dateIn: string

  @Prop()
  public maturity: string

  @Prop()
  public status: string

  @Prop()
  public user: string
}

export const ExpenseSchema = SchemaFactory.createForClass(Expense)
