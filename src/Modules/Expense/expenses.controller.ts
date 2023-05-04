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
  constructor(private readonly modelService: ExpenseService) {}

  @Post()
  create(@Body() createModelDto: ExpenselDto) {
    return this.modelService.create(createModelDto)
  }

  @Get()
  findAll(@Query() modelParam: ExpenseFilterDto) {
    return this.modelService.findAll(modelParam)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.modelService.findOne(id)
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateModelDto: ExpenselDto) {
    return this.modelService.update(id, updateModelDto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.modelService.remove(id)
  }
}
