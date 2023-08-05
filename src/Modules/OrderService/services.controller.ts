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
import {
  Headers,
  HttpCode,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common'
import {HttpStatus} from '@nestjs/common/enums'
import {
  FileFieldsInterceptor,
  FileInterceptor,
  FilesInterceptor,
} from '@nestjs/platform-express'
import {DocumentChangeStatusDto} from './dto/documentChangeStatus.dto'
import {ServiceDto} from './dto/service.dto'
import {ServiceFilterDto} from './dto/service.filter.dto'
import {ServicePartialPaymentDto} from './dto/service.partial.payment.dto'
import {ServiceService} from './services.service'

interface DeleteFileByName {
  fileName: string
}

@Controller('orderServices')
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}

  @Post()
  create(@Body() createServiceDto: ServiceDto, @Headers('user') user: string) {
    return this.serviceService.create(createServiceDto, user)
  }

  @Put('partial/payment')
  updateOrderServicePartialPayment(
    @Body() servicePartialPaymentDto: ServicePartialPaymentDto,
    @Headers('user') user: string,
  ) {
    return this.serviceService.updateOrderServicePartialPayment(
      servicePartialPaymentDto,
      user,
    )
  }

  @Get('total')
  getTotal() {
    return this.serviceService.getTotalOrderService()
  }

  @Get('total/maturity-boleto')
  getTotalIncomeMaturityOfTheBoleto() {
    return this.serviceService.getIncomeMaturityOfTheBoleto()
  }

  @Get('documents/:osNumber')
  getDocuments(@Param('osNumber') osNumber: string) {
    return this.serviceService.getDocuments(osNumber)
  }

  @Delete('documents')
  deleteFileByName(@Query() data: DeleteFileByName) {
    return this.serviceService.deleteFileByName(data?.fileName)
  }

  @Get('total-client-without-email')
  getTotalClientWithoutEmail() {
    return this.serviceService.getTotalClientWithoutEmail()
  }

  @Get('total-boleto-not-imported')
  getTotalBoletoNotImported() {
    return this.serviceService.getTotalBoletoNotImported()
  }

  @Post('upload/boleto/:osNumber')
  @UseInterceptors(FileFieldsInterceptor([{name: 'file[]', maxCount: 10}]))
  async uploadBoleto(
    @UploadedFiles() files: Express.Multer.File[],
    @Param('osNumber') osNumber: string,
  ) {
    return this.serviceService.uploadBoleto(files['file[]'], osNumber)
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
    return this.serviceService.moveFileGoogleDrive(data)
  }
  @Post('merge-pdf')
  mergePdf(
    @Body()
    data: {
      clientName: string
      idClient: string
      length: number
    },
    @Headers('user') user: string,
  ) {
    return this.serviceService.mergePdf(
      data.length,
      data.clientName,
      data.idClient,
    )
  }

  // @Delete('delete-document')
  // deleteDocument(@Query() data: DocumentChangeStatusDto) {
  //   return moveFileFolderClientByStatus(
  //     data.clientName,
  //     data.status,
  //     data.typeDocument,
  //     data.fileName,
  //   )
  // }

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
      idClient: string
      isMerge: boolean
    },
    @Headers('user') user: string,
  ) {
    try {
      return await this.serviceService.savePDF(
        data.id,
        data.base64Pdf,
        data.fileName,
        data.clientName,
        data.status,
        data.typeDocument,
        data.idClient,
        user,
        data.isMerge,
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

  @Delete(':id/:idFileCreatedGoogleDrive')
  remove(
    @Param('id') id: string,
    @Param('idFileCreatedGoogleDrive') idFileCreatedGoogleDrive: string,
  ) {
    return this.serviceService.remove(id, idFileCreatedGoogleDrive)
  }

  @Delete(':clientId')
  deleteOSByClientId(@Param('clientId') clientId: string) {
    return this.serviceService.deleteOSByClientId(clientId)
  }
}
