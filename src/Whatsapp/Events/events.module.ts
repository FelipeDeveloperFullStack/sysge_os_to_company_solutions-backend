import { Module } from '@nestjs/common'
import { ConnectionService } from '../Connection/connection.service'
import Websocket from './events.gateway'
import { EventsService } from './events.service'

@Module({
  providers: [Websocket, EventsService, ConnectionService],
})
export class EventsModule {}
