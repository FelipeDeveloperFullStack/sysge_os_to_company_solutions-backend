import {forwardRef, Module} from '@nestjs/common'
import {ChartController} from './chart.controller'
import {ChartService} from './chart.service'
import {ExpensesModule} from '../Expense/expenses.module'
import {OrderServicesModule} from '../OrderService/services.module'

@Module({
  imports: [
    forwardRef(() => ExpensesModule),
    forwardRef(() => OrderServicesModule),
  ],
  controllers: [ChartController],
  providers: [ChartService],
  exports: [ChartService],
})
export class ChartModule {}
