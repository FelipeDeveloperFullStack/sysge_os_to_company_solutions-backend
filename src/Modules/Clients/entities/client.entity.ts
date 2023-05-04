import {Prop, Schema, SchemaFactory} from '@nestjs/mongoose'
import {Document} from 'mongoose'

export type ClientDocument = Client & Document

@Schema()
export class Client {
  @Prop()
  public name: string

  @Prop()
  public address: string

  @Prop()
  public city: string

  @Prop()
  public uf: string

  @Prop()
  public cpfOrCnpj: string

  @Prop()
  public email: string

  @Prop()
  public phoneNumber: string

  @Prop()
  public phoneNumberFixo: string

  @Prop()
  public cep: string
}

export const ClientSchema = SchemaFactory.createForClass(Client)
