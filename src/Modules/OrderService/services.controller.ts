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
import {HttpCode} from '@nestjs/common/decorators'
import {HttpStatus} from '@nestjs/common/enums'
import {ServiceDto} from './dto/service.dto'
import {ServiceFilterDto} from './dto/service.filter.dto'
import {ServiceService} from './services.service'

@Controller('orderServices')
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}

  @Post()
  create(@Body() createServiceDto: ServiceDto) {
    return this.serviceService.create(createServiceDto)
  }

  @Get('total')
  getTotal() {
    return this.serviceService.getTotalOrderService()
  }

  @Get('total/incomes')
  getTotalIncomes() {
    return this.serviceService.getSumTotalIncomes()
  }

  @Post('generate/pdf')
  @HttpCode(HttpStatus.OK)
  async generatePDF(
    @Body() data: {base64Pdf: string; fileName: string},
  ): Promise<void> {
    try {
      await this.serviceService.savePDF(data.base64Pdf, data.fileName)
    } catch (error) {
      console.error(error)
      throw new Error('Erro ao salvar o arquivo PDF.')
    }
  }

  @Get()
  findAll(@Query() serviceParam: ServiceFilterDto) {
    return this.serviceService.findAll(serviceParam)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.serviceService.findOne(id)
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateServiceDto: ServiceDto) {
    return this.serviceService.update(id, updateServiceDto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.serviceService.remove(id)
  }
}
