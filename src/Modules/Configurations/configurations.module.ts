import {forwardRef, Module} from '@nestjs/common'
import {MongooseModule} from '@nestjs/mongoose'
import {ConfigurationSystemController} from './configurations.controller'
import {ConfigurationSystemService} from './configurations.service'
import {
  ConfigurationSystem,
  ConfigurationSystemSchema,
} from './entities/configurations.entity'
import {ExpensesModule} from '../Expense/expenses.module'
import {OrderServicesModule} from '../OrderService/services.module'

@Module({
  imports: [
    MongooseModule.forFeature([
      {name: ConfigurationSystem.name, schema: ConfigurationSystemSchema},
    ]),
    forwardRef(() => ExpensesModule),
    forwardRef(() => OrderServicesModule),
  ],
  controllers: [ConfigurationSystemController],
  providers: [ConfigurationSystemService],
  exports: [ConfigurationSystemService],
})
export class ConfigurationSystemModule {}
