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
  constructor(private readonly extractNubankService: ExtractNubankService) {}

  @Get('extract')
  findAll(@Query() extractDto: ExtractNubankFilterDto) {
    return this.extractNubankService.findAll(extractDto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.extractNubankService.remove(id)
  }
}
