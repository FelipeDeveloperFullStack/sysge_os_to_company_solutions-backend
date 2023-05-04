import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import EventsGateway from 'src/Whatsapp/Events/events.gateway'
import { CreateConnectionWhatsAppDto } from './dto/create-connection-whats-app.dto'
import { UpdateConnectionWhatsAppDto } from './dto/update-connection-whats-app.dto'
import {
  ConnectionWhatsApp,
  ConnectionWhatsAppDocument,
} from './entities/connection-whats-app.entity'

@Injectable()
export class ConnectionWhatsAppService {
  constructor(
    @InjectModel(ConnectionWhatsApp.name)
    private connectionWhatsAppModel: Model<ConnectionWhatsAppDocument>,
    private eventGateway: EventsGateway,
  ) {}

  async create(
    createConnectionWhatsAppDto: CreateConnectionWhatsAppDto,
  ): Promise<ConnectionWhatsApp> {
    const createConnectionWhatsApp = new this.connectionWhatsAppModel(
      createConnectionWhatsAppDto,
    )

    try {
      await createConnectionWhatsApp.save()
      this.eventGateway.socket.emit('connectionWhatsAppService.create', {
        status: 'created',
      })
      return createConnectionWhatsApp
    } catch (error) {
      console.trace(error)
      return error
    }
  }

  async findAll() {
    return await this.connectionWhatsAppModel.find().exec()
  }

  findOne(id: number) {
    return `This action returns a #${id} connectionWhatsApp`
  }

  update(id: number, updateConnectionWhatsAppDto: UpdateConnectionWhatsAppDto) {
    return `This action updates a #${id} connectionWhatsApp`
  }

  remove(id: number) {
    return `This action removes a #${id} connectionWhatsApp`
  }
}
