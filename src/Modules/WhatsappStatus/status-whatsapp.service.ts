import {Injectable} from '@nestjs/common'
import {OnEvent} from '@nestjs/event-emitter'
import {
  AUTO_CLOSE_CALLED,
  CONNECTED,
  DESCONNECTED_MOBILE,
  INCHAT,
  NOTLOGGED,
  STATUS_CONNECT,
} from '../WhatsappConnection/WebhookStatus'

@Injectable()
export class WhatsappStatusService {
  constructor(private eventGateway: any) {}

  @OnEvent(STATUS_CONNECT)
  onStatus(data: any) {
    console.log(data)
    if (data?.status === CONNECTED || data?.status === INCHAT) {
      this.eventGateway.socket?.emit(
        `connectionService.getConnection.client.ready-${data?.session}`,
        {
          status: 'ready',
          info: {
            number: data?.number,
          },
          sessionState: data?.session,
        },
      )
    }

    if (
      data?.status === DESCONNECTED_MOBILE ||
      data?.status === AUTO_CLOSE_CALLED ||
      data?.status === NOTLOGGED
    ) {
      this.eventGateway.socket?.emit(
        `connectionService.getConnection.client.ready-${data?.session}`,
        {
          status: 'desconnected',
          sessionState: data?.session,
        },
      )
    }

    if (data?.status === AUTO_CLOSE_CALLED) {
      this.eventGateway.socket?.emit(
        `connectionService.getConnection.client.autoCloseCalled-${data?.session}`,
        {
          status: 'autoCloseCalled',
          sessionState: data?.session,
        },
      )
    }
  }
}
