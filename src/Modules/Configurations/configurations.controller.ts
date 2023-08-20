import {Body, Controller, Get, Post, Put, Query} from '@nestjs/common'
import {ConfigurationSystemService} from './configurations.service'
import {ConfigurationSystemDto} from './dto/configurations.dto'

@Controller('configurations')
export class ConfigurationSystemController {
  constructor(private readonly confiService: ConfigurationSystemService) {}

  @Get()
  findAll() {
    return this.confiService.findAll()
  }

  @Get('send')
  sendMidia(@Query() phoneNumber: string, osNumber: string) {
    return this.confiService.sendMidia(phoneNumber, osNumber)
  }

  @Get('status/connection')
  getStatusConnection() {
    return this.confiService.getStatusConnection()
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
