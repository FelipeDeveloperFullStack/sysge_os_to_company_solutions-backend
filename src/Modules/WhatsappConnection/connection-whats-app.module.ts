import {Module} from '@nestjs/common'
import {MongooseModule} from '@nestjs/mongoose'
import {ConnectionWhatsAppController} from './connection-whats-app.controller'
import {ConnectionWhatsAppService} from './connection-whats-app.service'
import {
  ConenctionWhatsAppSchema,
  ConnectionWhatsApp,
} from './entities/connection-whats-app.entity'

@Module({
  imports: [
    MongooseModule.forFeature([
      {name: ConnectionWhatsApp.name, schema: ConenctionWhatsAppSchema},
    ]),
  ],
  controllers: [ConnectionWhatsAppController],
  providers: [ConnectionWhatsAppService],
})
export class ConnectionWhatsAppModule {}
