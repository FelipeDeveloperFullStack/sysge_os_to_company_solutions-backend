import {forwardRef, Module} from '@nestjs/common'
import {MongooseModule} from '@nestjs/mongoose'
import {ScheduleBoletoModule} from 'src/Schedule/EmailBoleto/emailBoleto.module'
import {ExpensesModule} from '../Expense/expenses.module'
import {OrderServicesModule} from '../OrderService/services.module'
import {ClientsController} from './clients.controller'
import {ClientsService} from './clients.service'
import {Client, ClientSchema} from './entities/client.entity'

@Module({
  imports: [
    MongooseModule.forFeature([{name: Client.name, schema: ClientSchema}]),
    forwardRef(() => ScheduleBoletoModule),
    forwardRef(() => OrderServicesModule),
    forwardRef(() => ExpensesModule),
  ],
  controllers: [ClientsController],
  providers: [ClientsService],
  exports: [ClientsService],
})
export class ClientsModule {}
