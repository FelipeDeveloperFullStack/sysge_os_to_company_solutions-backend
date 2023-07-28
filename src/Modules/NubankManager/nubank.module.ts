import {forwardRef, Module} from '@nestjs/common'
import {MongooseModule} from '@nestjs/mongoose'
import {ExtractNubankController} from './nubank.controller'
import {ExtractNubankService} from './nubank.service'
import {ExtractNubank, ExtractNubankSchema} from './entities/nubank.entity'
import {ExpensesModule} from '../Expense/expenses.module'

@Module({
  imports: [
    MongooseModule.forFeature([
      {name: ExtractNubank.name, schema: ExtractNubankSchema},
    ]),
    forwardRef(() => ExpensesModule),
  ],
  controllers: [ExtractNubankController],
  providers: [ExtractNubankService],
  exports: [ExtractNubankService],
})
export class ExtractNubankModule {}
