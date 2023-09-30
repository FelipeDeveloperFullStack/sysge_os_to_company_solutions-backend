import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common'
import {FileFieldsInterceptor} from '@nestjs/platform-express'
import {ExtractNubankFilterDto} from './dto/nubank.filter.dto'
import {ExtractNubankService} from './nubank.service'

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

  @Post('upload/extract')
  @UseInterceptors(FileFieldsInterceptor([{name: 'file[]', maxCount: 10}]))
  async uploadExtract(@UploadedFiles() files: Express.Multer.File[]) {
    return this.extractNubankService.extractDataNubankEmail(files['file[]'])
  }
}
