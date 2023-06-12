import {Injectable} from '@nestjs/common'
import {OnEvent} from '@nestjs/event-emitter'

@Injectable()
export class ConnectionUserWaService {
  // constructor(private eventService: any) {}

  async getConnectionWhatsApp(cpf: string) {
    // await this.eventService.connect(cpf)
  }

  // @OnEvent('order.created', {async: true})
  // handleCreateUserEvent(event: string) {
  //   return event
  // }
}
