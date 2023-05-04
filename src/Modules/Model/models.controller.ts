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
import {ModelDto} from './dto/model.dto'
import {ModelFilterDto} from './dto/model.filter.dto'
import {ModelService} from './models.service'

@Controller('models')
export class ModelController {
  constructor(private readonly modelService: ModelService) {}

  @Post()
  create(@Body() createModelDto: ModelDto) {
    return this.modelService.create(createModelDto)
  }

  @Get()
  findAll(@Query() modelParam: ModelFilterDto) {
    return this.modelService.findAll(modelParam)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.modelService.findOne(id)
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateModelDto: ModelDto) {
    return this.modelService.update(id, updateModelDto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.modelService.remove(id)
  }
}
