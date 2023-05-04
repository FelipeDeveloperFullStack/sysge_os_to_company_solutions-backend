import {
  Controller,
  Get,
  Param,
  HttpCode,
} from '@nestjs/common'
import { ConnectionUserWaService } from './connection-user-wa.service'

@Controller('connection-user-wa')
export class ConnectionUserWaController {
  constructor(
    private readonly connectionUserWaService: ConnectionUserWaService,
  ) {}

  @Get(':cpf')
  @HttpCode(200)
  async getConnectionWhatsApp(@Param('cpf') cpf: string) {
    await this.connectionUserWaService.getConnectionWhatsApp(cpf)
    /**
     * @description
     * Fire socket to frontend [Here]
     */
    return JSON.stringify('Connection called, waiting for connection device...')
  }
  
}
