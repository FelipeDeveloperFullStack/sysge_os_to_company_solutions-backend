import {forwardRef, Module} from '@nestjs/common'
import {MongooseModule} from '@nestjs/mongoose'
import {ExtractNubankModule} from '../NubankManager/nubank.module'
import {Expense, ExpenseSchema} from './entities/expense.entity'
import {ModelController} from './expenses.controller'
import {ExpenseService} from './expenses.service'

@Module({
  imports: [
    MongooseModule.forFeature([{name: Expense.name, schema: ExpenseSchema}]),
    forwardRef(() => ExtractNubankModule),
  ],
  controllers: [ModelController],
  providers: [ExpenseService],
  exports: [ExpenseService],
})
export class ExpensesModule {}
