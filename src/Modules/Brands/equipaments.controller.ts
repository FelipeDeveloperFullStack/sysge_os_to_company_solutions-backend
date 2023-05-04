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
import {EquipamentService} from './equipaments.service'
import {EquipamentDto} from './dto/equipament.dto'
import {EquipamentFilterDto} from './dto/equipament.filter.dto'

@Controller('equipaments')
export class EquipamentController {
  constructor(private readonly equipamentService: EquipamentService) {}

  @Post()
  create(@Body() createEquipamentDto: EquipamentDto) {
    return this.equipamentService.create(createEquipamentDto)
  }

  @Get('total')
  getTotal() {
    return this.equipamentService.getTotalEquipaments()
  }

  @Get()
  findAll(@Query() equipamentParam: EquipamentFilterDto) {
    return this.equipamentService.findAll(equipamentParam)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.equipamentService.findOne(id)
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateEquipamentDto: EquipamentDto) {
    return this.equipamentService.update(id, updateEquipamentDto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.equipamentService.remove(id)
  }
}
