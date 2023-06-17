import {Module} from '@nestjs/common'
import {MongooseModule} from '@nestjs/mongoose'
import {SocketService} from 'src/Socket/socket.service'
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
  providers: [ServiceService, SocketService],
  exports: [ServiceService],
})
export class OrderServicesModule {}
