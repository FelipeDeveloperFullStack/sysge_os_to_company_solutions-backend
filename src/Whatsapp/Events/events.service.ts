import {Injectable} from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import {Message} from 'whatsapp-web.js'
import {ConnectionService} from '../Connection/connection.service'
import EventsGateway from './events.gateway'
import { ONEVENT_CANCEL_SINCRONIZATION_WHATSAPP } from './EventType'
@Injectable()
export class EventsService {
  constructor(
    private eventGateway: EventsGateway,
    private connectionService: ConnectionService,
  ) {}

  @OnEvent(ONEVENT_CANCEL_SINCRONIZATION_WHATSAPP)
  public async connect(cpf: string) {
    // this.eventGateway.socket.emit('eventsService.connect', {
    //   status: 'waitingConnection',
    // })

    const instanceClient = this.connectionService.getInstance(cpf)
    console.log({ Contacts: await instanceClient.getContacts() })

    // const client = await this.connectionService.getConnection(cpf)
    instanceClient.on('message', (message: Message) => {
      // const { _data: data } = message

      console.log(JSON.stringify(message, null, 2))
    })
  }
}
