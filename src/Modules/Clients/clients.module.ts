import {forwardRef, Module} from '@nestjs/common'
import {MongooseModule} from '@nestjs/mongoose'
import {ScheduleBoletoModule} from 'src/Schedule/EmailBoleto/emailBoleto.module'
import {OrderServicesModule} from '../OrderService/services.module'
import {ServiceService} from '../OrderService/services.service'
import {ClientsController} from './clients.controller'
import {ClientsService} from './clients.service'
import {Client, ClientSchema} from './entities/client.entity'

@Module({
  imports: [
    MongooseModule.forFeature([{name: Client.name, schema: ClientSchema}]),
    forwardRef(() => OrderServicesModule),
    forwardRef(() => ScheduleBoletoModule),
  ],
  controllers: [ClientsController],
  providers: [ClientsService],
  exports: [ClientsService],
})
export class ClientsModule {}
