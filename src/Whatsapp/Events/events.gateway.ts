import { Logger } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import {
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { ONEVENT_CANCEL_SINCRONIZATION_WHATSAPP } from './EventType'

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export default class EventsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  socket: Server

  private logger = new Logger('AppGateway')

  constructor(private eventEmitter: EventEmitter2) {
    eventEmitter.setMaxListeners(5)
  }

  handleConnection(client: Socket) {
    this.logger.log(`New client connected ${client.id}`)
    client.emit('connection', 'Successfully connected to server')
  }

  handleDisconnect(client: Socket) {
    this.logger.log('Client disconnected')
  }

  @SubscribeMessage('cancelSincronizationWhatsApp')
  onEventCancelSincronizationWhatsApp(@MessageBody() data: unknown) {
    this.eventEmitter.emit(ONEVENT_CANCEL_SINCRONIZATION_WHATSAPP, data)
  }
}
