import {forwardRef, Module} from '@nestjs/common'
import {MongooseModule} from '@nestjs/mongoose'
import {ClientsModule} from '../Clients/clients.module'
import {ConfigurationSystemModule} from '../Configurations/configurations.module'
import {ExpensesModule} from '../Expense/expenses.module'
import {OrderServicesModule} from '../OrderService/services.module'
import {ExtractNubank, ExtractNubankSchema} from './entities/nubank.entity'
import {ExtractNubankController} from './nubank.controller'
import {ExtractNubankService} from './nubank.service'

@Module({
  imports: [
    MongooseModule.forFeature([
      {name: ExtractNubank.name, schema: ExtractNubankSchema},
    ]),
    forwardRef(() => ExpensesModule),
    forwardRef(() => ClientsModule),
    forwardRef(() => OrderServicesModule),
    forwardRef(() => ConfigurationSystemModule),
  ],
  controllers: [ExtractNubankController],
  providers: [ExtractNubankService],
  exports: [ExtractNubankService],
})
export class ExtractNubankModule {}
