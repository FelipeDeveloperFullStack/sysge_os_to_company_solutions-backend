import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

export type UserDocument = User & Document

@Schema()
export class User {
  @Prop()
  public name: string

  @Prop()
  public email: string

  @Prop()
  public cpf: number

  @Prop()
  public password: string
  
  @Prop()
  public token: string

  @Prop({ default: false })
  public isTokenValidated: boolean

}

export const UserSchema = SchemaFactory.createForClass(User)