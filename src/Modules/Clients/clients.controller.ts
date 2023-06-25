import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common'
import {ClientsService} from './clients.service'
import {ClientDto} from './dto/client.dto'
import {ClientFilterDto} from './dto/client.filter.dto'

@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  create(@Body() createClientDto: ClientDto, @Headers('user') user: string) {
    return this.clientsService.create(createClientDto, user)
  }

  @Get('total')
  getTotal() {
    return this.clientsService.getTotalIncomes()
  }

  @Get()
  findAll(@Query() clientParam: ClientFilterDto) {
    return this.clientsService.findAll(clientParam)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.clientsService.findOne(id)
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateClientDto: ClientDto,
    @Headers('user') user: string,
  ) {
    return this.clientsService.update(id, updateClientDto, user)
  }

  @Delete(':id/:idFolderClientName')
  remove(
    @Param('id') id: string,
    @Param('idFolderClientName') idFolderClientName: string,
  ) {
    return this.clientsService.remove(id, idFolderClientName)
  }
}
