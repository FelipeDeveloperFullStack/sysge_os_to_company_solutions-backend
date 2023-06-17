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
import {DocumentChangeStatusDto} from './dto/documentChangeStatus.dto'
import {ServiceDto} from './dto/service.dto'
import {ServiceFilterDto} from './dto/service.filter.dto'
import {moveFileFolderClientByStatus} from './googleDrive/moveFileFolderClient'
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

  @Get('total/orcamentos')
  getTotalOrcamentos() {
    return this.serviceService.getSumTotalOrcamento()
  }

  @Get('move-file-by-status')
  moveFileByStatusDocument(@Query() data: DocumentChangeStatusDto) {
    return moveFileFolderClientByStatus(
      data.clientName,
      data.status,
      data.typeDocument,
      data.fileName,
    )
  }
  @Delete('delete-document')
  deleteDocument(@Query() data: DocumentChangeStatusDto) {
    return moveFileFolderClientByStatus(
      data.clientName,
      data.status,
      data.typeDocument,
      data.fileName,
    )
  }

  @Post('generate/pdf')
  @HttpCode(HttpStatus.OK)
  async generatePDF(
    @Body()
    data: {
      id: string
      base64Pdf: string
      fileName: string
      clientName: string
      status: string
      typeDocument: string
    },
  ): Promise<void> {
    try {
      await this.serviceService.savePDF(
        data.id,
        data.base64Pdf,
        data.fileName,
        data.clientName,
        data.status,
        data.typeDocument,
      )
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
