import {forwardRef, Module} from '@nestjs/common'
import {ClientsModule} from 'src/Modules/Clients/clients.module'
import {ConfigurationSystemModule} from 'src/Modules/Configurations/configurations.module'
import {OrderServicesModule} from 'src/Modules/OrderService/services.module'
import {ScheduleBoletoService} from './ScheduleBoletoService'

@Module({
  imports: [
    forwardRef(() => OrderServicesModule),
    forwardRef(() => ClientsModule),
    forwardRef(() => ConfigurationSystemModule),
  ],
  controllers: [],
  providers: [ScheduleBoletoService],
  exports: [ScheduleBoletoService],
})
export class ScheduleBoletoModule {}
