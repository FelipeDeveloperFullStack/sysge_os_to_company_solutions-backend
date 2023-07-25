import {Module} from '@nestjs/common'
import {MongooseModule} from '@nestjs/mongoose'
import {ExtractNubankController} from './nubank.controller'
import {ExtractNubankService} from './nubank.service'
import {ExtractNubank, ExtractNubankSchema} from './entities/nubank.entity'

@Module({
  imports: [
    MongooseModule.forFeature([
      {name: ExtractNubank.name, schema: ExtractNubankSchema},
    ]),
  ],
  controllers: [ExtractNubankController],
  providers: [ExtractNubankService],
  exports: [ExtractNubankService],
})
export class ExtractNubankModule {}
