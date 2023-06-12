import {Module} from '@nestjs/common'
import {ConfigModule} from '@nestjs/config'
import {EventEmitterModule} from '@nestjs/event-emitter'
import {MongooseModule} from '@nestjs/mongoose'
import {ScheduleModule} from '@nestjs/schedule'
import {MongodbModule} from 'src/Database/Mongodb/mongodb.module'
import {MailModule} from './mails/mail.module'
import {AuthModule} from './Modules/Authentication/AuthToken/auth/auth.module'
import {ConnectionUserWaModule} from './Modules/Authentication/connectionUserWa/connection-user-wa.module'
import {AuthorizationModule} from './Modules/Authorization/authorization.module'
import {EquipamentsModule} from './Modules/Brands/equipaments.module'
import {ClientsModule} from './modules/clients/clients.module'
import {ModelsModule} from './Modules/Model/models.module'
import {PiecesModule} from './modules/Pieces/pieces.module'
import {ServicesModule} from './modules/Service/services.module'
import {OrderServicesModule} from './modules/OrderService/services.module'
import {ConnectionWhatsAppModule} from './Modules/WhatsappConnection/connection-whats-app.module'
import {WhatsappMessageService} from './Modules/WhatsappMessage/whatsapp-message.service'
import {WhatsappQrcodeService} from './modules/WhatsappQrcode/whatsapp-qrcode.service'
import {WhatsappStatusService} from './Modules/WhatsappStatus/status-whatsapp.service'
import {ExpensesModule} from './Modules/Expense/expenses.module'

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGODB_URL),
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true, // no need to import into other modules
    }),
    EventEmitterModule.forRoot({
      // set this to `true` to use wildcards
      wildcard: false,
      // the delimiter used to segment namespaces
      delimiter: '.',
      // set this to `true` if you want to emit the newListener event
      newListener: false,
      // set this to `true` if you want to emit the removeListener event
      removeListener: false,
      // the maximum amount of listeners that can be assigned to an event
      maxListeners: 10,
      // show event name in memory leak message when more than maximum amount of listeners is assigned
      verboseMemoryLeak: false,
      // disable throwing uncaughtException if an error event is emitted and it has no listeners
      ignoreErrors: false,
    }),
    /** Modules application */
    MongodbModule,
    ConnectionUserWaModule,
    MailModule,
    ConnectionWhatsAppModule,
    AuthorizationModule,
    AuthModule,
    ClientsModule,
    PiecesModule,
    ServicesModule,
    OrderServicesModule,
    EquipamentsModule,
    ModelsModule,
    ExpensesModule,
  ],
  controllers: [],
  providers: [
    WhatsappStatusService,
    WhatsappMessageService,
    WhatsappQrcodeService,
  ],
})
export class AppModule {}
