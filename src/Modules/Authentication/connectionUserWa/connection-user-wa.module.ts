import { Module } from '@nestjs/common';
import { ConnectionUserWaService } from './connection-user-wa.service';
import { ConnectionUserWaController } from './connection-user-wa.controller';
import { EventsService } from 'src/Whatsapp/Events/events.service';
import EventsGateway from 'src/Whatsapp/Events/events.gateway';
import { ConnectionService } from 'src/Whatsapp/Connection/connection.service';

@Module({
  controllers: [ConnectionUserWaController],
  providers: [ConnectionUserWaService, EventsService, EventsGateway, ConnectionService]
})
export class ConnectionUserWaModule {}
