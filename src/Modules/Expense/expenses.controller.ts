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
import {ExpenselDto} from './dto/expense.dto'
import {ExpenseFilterDto} from './dto/expense.filter.dto'
import {ExpenseService} from './expenses.service'

@Controller('expense')
export class ModelController {
  constructor(private readonly modelExpense: ExpenseService) {}

  @Post()
  create(@Body() createModelDto: ExpenselDto) {
    return this.modelExpense.create(createModelDto)
  }

  @Get()
  findAll(@Query() modelParam: ExpenseFilterDto) {
    return this.modelExpense.findAll(modelParam)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.modelExpense.findOne(id)
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateModelDto: ExpenselDto) {
    return this.modelExpense.update(id, updateModelDto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.modelExpense.remove(id)
  }
}
