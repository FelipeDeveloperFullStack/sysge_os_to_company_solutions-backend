import { Injectable } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { EventsService } from 'src/Whatsapp/Events/events.service'

@Injectable()
export class ConnectionUserWaService {
  constructor(private eventService: EventsService) {}

  async getConnectionWhatsApp(cpf: string) {
    await this.eventService.connect(cpf)
  }

  @OnEvent('order.created', { async: true })
  handleCreateUserEvent(event: string) {
    return event
  }
}
