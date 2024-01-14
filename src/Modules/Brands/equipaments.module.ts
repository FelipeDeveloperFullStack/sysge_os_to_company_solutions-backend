import {Module} from '@nestjs/common'
import {MongooseModule} from '@nestjs/mongoose'
import {EquipamentController} from './equipaments.controller'
import {EquipamentService} from './equipaments.service'
import {Equipament, EquipamentSchema} from './entities/equipament.entity'

@Module({
  imports: [
    MongooseModule.forFeature([
      {name: Equipament.name, schema: EquipamentSchema},
    ]),
  ],
  controllers: [EquipamentController],
  providers: [EquipamentService],
  exports: [EquipamentService],
})
export class EquipamentsModule {}
