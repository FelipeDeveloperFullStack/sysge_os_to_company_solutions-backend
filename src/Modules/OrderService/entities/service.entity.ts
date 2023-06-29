import {Prop, Schema, SchemaFactory} from '@nestjs/mongoose'
import {Document} from 'mongoose'
//import {ClientT, ItemPieces, ItemServices, Laudo} from '../dto/type'
export type ServiceDocument = OrderService & Document

class Client {
  @Prop()
  id?: string

  @Prop()
  name?: string

  @Prop()
  cpfOrCnpj?: string

  @Prop()
  email?: string

  @Prop()
  phoneNumber?: string

  @Prop()
  phoneNumberFixo?: string

  @Prop()
  address?: string

  @Prop()
  city?: string

  @Prop()
  uf?: string

  @Prop()
  cep?: string
}

@Schema()
export class OrderService {
  @Prop()
  public status: string

  @Prop()
  public formOfPayment: string

  @Prop()
  public osNumber: string

  @Prop()
  public dateOS: string

  @Prop()
  public dateGeneratedOS: string

  @Prop()
  public equipament: string

  @Prop()
  public brand: string

  @Prop()
  public model: string

  @Prop()
  public serialNumber: string

  @Prop()
  public cable: string

  @Prop()
  public charger: string

  @Prop()
  public breaked: string

  @Prop()
  public detail: string

  @Prop({type: Client})
  public client: Client

  @Prop()
  public itemServices: {
    id: string
    description: string
    qtde: number
    unit: string
    total: number
  }[]

  @Prop()
  public laudos: {
    checked: boolean
    description: string
    service: string
  }[]

  @Prop()
  public itemPieces: {
    id: string
    description: string
    qtde: number
    unit: string
    total: number
  }[]

  @Prop()
  public manpower: string

  @Prop()
  public typeDocument: string

  @Prop()
  public total: string

  @Prop()
  public subTotal: string

  @Prop()
  public discount: string

  @Prop()
  public idFileCreatedGoogleDrive: string

  @Prop()
  public user: string

  @Prop()
  public maturityOfTheBoleto: string
}

export const ServiceSchema = SchemaFactory.createForClass(OrderService)
