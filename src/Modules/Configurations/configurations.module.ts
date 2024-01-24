import {forwardRef, Module} from '@nestjs/common'
import {MongooseModule} from '@nestjs/mongoose'
import {ScheduleBoletoModule} from 'src/Schedule/EmailBoleto/emailBoleto.module'
import {SocketService} from 'src/Socket/socket.service'
import {ExpensesModule} from '../Expense/expenses.module'
import {ExtractNubankModule} from '../NubankManager/nubank.module'
import {OrderServicesModule} from '../OrderService/services.module'
import {ConfigurationSystemController} from './configurations.controller'
import {ConfigurationSystemService} from './configurations.service'
import {
  ConfigurationSystem,
  ConfigurationSystemSchema,
} from './entities/configurations.entity'

@Module({
  imports: [
    MongooseModule.forFeature([
      {name: ConfigurationSystem.name, schema: ConfigurationSystemSchema},
    ]),
    forwardRef(() => ExpensesModule),
    forwardRef(() => ExtractNubankModule),
    forwardRef(() => ScheduleBoletoModule),
    forwardRef(() => OrderServicesModule),
  ],
  controllers: [ConfigurationSystemController],
  providers: [ConfigurationSystemService, SocketService],
  exports: [ConfigurationSystemService],
})
export class ConfigurationSystemModule {}
