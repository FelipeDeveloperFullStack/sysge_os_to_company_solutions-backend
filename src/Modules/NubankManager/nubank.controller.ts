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
import {ExtractNubankService} from './nubank.service'
import {ExtractNubankDto} from './dto/nubank.dto'
import {ExtractNubankFilterDto} from './dto/nubank.filter.dto'

@Controller('nubank')
export class ExtractNubankController {
  constructor(private readonly equipamentService: ExtractNubankService) {}

  @Post()
  create(@Body() createEquipamentDto: ExtractNubankDto) {
    return this.equipamentService.create(createEquipamentDto)
  }

  @Get('extract')
  findAll(@Query() equipamentParam: ExtractNubankFilterDto) {
    return this.equipamentService.findAll(equipamentParam)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.equipamentService.findOne(id)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.equipamentService.remove(id)
  }
}
