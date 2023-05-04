import {Module} from '@nestjs/common'
import {MongooseModule} from '@nestjs/mongoose'
import {Expense, ExpenseSchema} from './entities/expense.entity'
import {ModelController} from './expenses.controller'
import {ExpenseService} from './expenses.service'

@Module({
  imports: [
    MongooseModule.forFeature([{name: Expense.name, schema: ExpenseSchema}]),
  ],
  controllers: [ModelController],
  providers: [ExpenseService],
  exports: [ExpenseService],
})
export class ExpensesModule {}
