import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common'
import {EventEmitter2} from '@nestjs/event-emitter'
import {JwtAuthGuard} from '../Authentication/AuthToken/auth/jwt-auth.guard'
import {ConnectionWhatsAppService} from './connection-whats-app.service'
import {CreateConnectionWhatsAppDto} from './dto/create-connection-whats-app.dto'
import {UpdateConnectionWhatsAppDto} from './dto/update-connection-whats-app.dto'

@Controller('connection-whats-app')
export class ConnectionWhatsAppController {
  constructor(
    private readonly connectionWhatsAppService: ConnectionWhatsAppService,
    private eventEmitter: EventEmitter2,
  ) {}

  @Post('create')
  @UseGuards(JwtAuthGuard)
  create(@Body() createConnectionWhatsAppDto: CreateConnectionWhatsAppDto) {
    return this.connectionWhatsAppService.create(createConnectionWhatsAppDto)
  }

  @Post('webhook')
  webhook(@Body() data: any) {
    if (data?.wook !== 'QRCODE') console.log({webhook: data})
    this.eventEmitter.emit(data?.wook, data)
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.connectionWhatsAppService.findAll()
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.connectionWhatsAppService.findOne(+id)
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateConnectionWhatsAppDto: UpdateConnectionWhatsAppDto,
  ) {
    return this.connectionWhatsAppService.update(
      +id,
      updateConnectionWhatsAppDto,
    )
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.connectionWhatsAppService.remove(+id)
  }
}
