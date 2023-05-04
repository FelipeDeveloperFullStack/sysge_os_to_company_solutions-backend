import {Module} from '@nestjs/common'
import {MongooseModule} from '@nestjs/mongoose'
import {OrderService, ServiceSchema} from './entities/service.entity'
import {ServiceController} from './services.controller'
import {ServiceService} from './services.service'

@Module({
  imports: [
    MongooseModule.forFeature([
      {name: OrderService.name, schema: ServiceSchema},
    ]),
  ],
  controllers: [ServiceController],
  providers: [ServiceService],
  exports: [ServiceService],
})
export class OrderServicesModule {}
