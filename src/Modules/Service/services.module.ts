import {Module} from '@nestjs/common'
import {MongooseModule} from '@nestjs/mongoose'
import {Service, ServiceSchema} from './entities/service.entity'
import {ServiceController} from './services.controller'
import {ServiceService} from './services.service'

@Module({
  imports: [
    MongooseModule.forFeature([{name: Service.name, schema: ServiceSchema}]),
  ],
  controllers: [ServiceController],
  providers: [ServiceService],
  exports: [ServiceService],
})
export class ServicesModule {}
