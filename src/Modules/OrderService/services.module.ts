import {forwardRef, Module} from '@nestjs/common'
import {MongooseModule} from '@nestjs/mongoose'
import {ScheduleBoletoModule} from 'src/Schedule/EmailBoleto/emailBoleto.module'
import {SocketService} from 'src/Socket/socket.service'
import {ClientsModule} from '../Clients/clients.module'
import {ConfigurationSystemModule} from '../Configurations/configurations.module'
import {ExtractNubankModule} from '../NubankManager/nubank.module'
import {OrderService, ServiceSchema} from './entities/service.entity'
import {ServiceController} from './services.controller'
import {ServiceService} from './services.service'

@Module({
  imports: [
    MongooseModule.forFeature([
      {name: OrderService.name, schema: ServiceSchema},
    ]),
    forwardRef(() => ClientsModule),
    forwardRef(() => ScheduleBoletoModule),
    forwardRef(() => ConfigurationSystemModule),
    forwardRef(() => ExtractNubankModule),
  ],
  controllers: [ServiceController],
  providers: [ServiceService, SocketService],
  exports: [ServiceService],
})
export class OrderServicesModule {}
