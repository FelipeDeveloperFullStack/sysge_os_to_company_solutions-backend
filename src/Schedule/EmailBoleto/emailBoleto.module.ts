import {forwardRef, Module, OnApplicationBootstrap} from '@nestjs/common'
import {ClientsModule} from 'src/Modules/Clients/clients.module'
import {OrderServicesModule} from 'src/Modules/OrderService/services.module'
import {ScheduleBoletoService} from './ScheduleBoletoService'

@Module({
  imports: [
    forwardRef(() => OrderServicesModule),
    forwardRef(() => ClientsModule),
  ],
  controllers: [],
  providers: [ScheduleBoletoService],
  exports: [ScheduleBoletoService],
})
export class ScheduleBoletoModule {}
