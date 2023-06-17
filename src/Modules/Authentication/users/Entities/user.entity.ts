import {Prop, Schema, SchemaFactory} from '@nestjs/mongoose'
import {Document} from 'mongoose'
import {IPermissions} from '../Types'

export type UserDocument = User & Document

@Schema()
export class User {
  @Prop()
  public name: string

  @Prop()
  public email: string

  @Prop()
  public cpf: string

  @Prop()
  public password: string

  @Prop()
  public token: string

  @Prop({default: false})
  public isTokenValidated: boolean

  @Prop()
  public typeUser: string

  @Prop()
  public status: string

  @Prop()
  public permissions: IPermissions[]
}

export const UserSchema = SchemaFactory.createForClass(User)
