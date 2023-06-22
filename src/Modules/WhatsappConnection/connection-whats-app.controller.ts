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
import {readEmailsWithAttachments} from 'src/Automations/Nubank'
import {JwtAuthGuard} from '../Authentication/AuthToken/auth/jwt-auth.guard'
import {ConnectionWhatsAppService} from './connection-whats-app.service'
import {CreateConnectionWhatsAppDto} from './dto/create-connection-whats-app.dto'
import {UpdateConnectionWhatsAppDto} from './dto/update-connection-whats-app.dto'

@Controller('automations')
export class ConnectionWhatsAppController {
  constructor(
    private readonly connectionWhatsAppService: ConnectionWhatsAppService,
    private eventEmitter: EventEmitter2,
  ) {}

  @Get('start/nubank')
  @UseGuards(JwtAuthGuard)
  create(@Body() createConnectionWhatsAppDto: CreateConnectionWhatsAppDto) {
    readEmailsWithAttachments()
    return ''
  }
}
