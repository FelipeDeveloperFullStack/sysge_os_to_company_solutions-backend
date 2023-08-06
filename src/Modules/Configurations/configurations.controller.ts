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
import {ConfigurationSystemService} from './configurations.service'
import {ConfigurationSystemDto} from './dto/configurations.dto'

@Controller('configurations')
export class ConfigurationSystemController {
  constructor(private readonly confiService: ConfigurationSystemService) {}

  @Get()
  findAll() {
    return this.confiService.findAll()
  }

  @Get('connect/whatsapp')
  connectWhatsapp() {
    return this.confiService.connectWhatsapp()
  }

  @Put('update')
  createOrUpdate(@Body() configurationSystemDto: ConfigurationSystemDto) {
    return this.confiService.createOrUpdate(configurationSystemDto)
  }

  @Post()
  webhook(@Body() dataWebHookResponse: any) {
    return this.confiService.webhook(dataWebHookResponse)
  }
}
