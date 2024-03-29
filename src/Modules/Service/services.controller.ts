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
import {ServiceDto} from './dto/service.dto'
import {ServiceFilterDto} from './dto/service.filter.dto'
import {ServiceService} from './services.service'

@Controller('services')
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}

  @Post()
  create(@Body() createServiceDto: ServiceDto, @Headers('user') user: string) {
    return this.serviceService.create(createServiceDto, user)
  }

  @Get('total')
  getTotal() {
    return this.serviceService.getTotalService()
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
  update(
    @Param('id') id: string,
    @Body() updateServiceDto: ServiceDto,
    @Headers('user') user: string,
  ) {
    return this.serviceService.update(id, updateServiceDto, user)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.serviceService.remove(id)
  }
}
