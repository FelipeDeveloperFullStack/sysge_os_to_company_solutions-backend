import {forwardRef, Module} from '@nestjs/common'
import {MongooseModule} from '@nestjs/mongoose'
import {ScheduleBoletoModule} from 'src/Schedule/EmailBoleto/emailBoleto.module'
import {SocketService} from 'src/Socket/socket.service'
import {ClientsModule} from '../Clients/clients.module'
import {ConfigurationSystemModule} from '../Configurations/configurations.module'
import {ExpensesModule} from '../Expense/expenses.module'
import {ExtractNubankModule} from '../NubankManager/nubank.module'
import {OrderService, ServiceSchema} from './entities/service.entity'
import {ServiceController} from './services.controller'
import {ServiceService} from './services.service'
import { ConfigurationSystemService } from '../Configurations/configurations.service'

@Module({
  imports: [
    MongooseModule.forFeature([
      {name: OrderService.name, schema: ServiceSchema},
    ]),
    forwardRef(() => ConfigurationSystemModule),
    forwardRef(() => ClientsModule),
    forwardRef(() => ScheduleBoletoModule),
    forwardRef(() => ExtractNubankModule),
    forwardRef(() => ExpensesModule),
  ],
  controllers: [ServiceController],
  providers: [ServiceService, SocketService],
  exports: [ServiceService],
})
export class OrderServicesModule {}
