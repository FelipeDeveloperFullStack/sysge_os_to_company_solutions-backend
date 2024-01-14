import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common'
import {Headers} from '@nestjs/common/decorators'
import {ExpenselDto} from './dto/expense.dto'
import {ExpenseFilterDto} from './dto/expense.filter.dto'
import {ExpenseService} from './expenses.service'

@Controller('expense')
export class ModelController {
  constructor(private readonly modelExpense: ExpenseService) {}

  @Post()
  create(@Body() createModelDto: ExpenselDto, @Headers('user') user: string) {
    return this.modelExpense.create(createModelDto, user)
  }

  @Get()
  findAll(@Query() modelParam: ExpenseFilterDto) {
    return this.modelExpense.findAll(modelParam)
  }

  @Get('personal')
  findAllPersonalExpense() {
    return this.modelExpense.findAllPersonalExpense()
  }

  @Get('expired')
  expiredExpenses() {
    return this.modelExpense.getExpensesData()
  }

  @Get('total')
  getTotalExpenses() {
    return this.modelExpense.getSumTotalExpense()
  }

  @Get('total/expense/month')
  getSumTotalExpenseType() {
    return this.modelExpense.getSumTotalExpenseType()
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.modelExpense.findOne(id)
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateModelDto: ExpenselDto,
    @Headers('user') user: string,
  ) {
    return this.modelExpense.update(id, updateModelDto, user)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.modelExpense.remove(id)
  }
}
