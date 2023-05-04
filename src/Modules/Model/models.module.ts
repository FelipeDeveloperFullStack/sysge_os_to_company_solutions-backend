import {Module} from '@nestjs/common'
import {MongooseModule} from '@nestjs/mongoose'
import {Model, ModelSchema} from './entities/model.entity'
import {ModelController} from './models.controller'
import {ModelService} from './models.service'

@Module({
  imports: [
    MongooseModule.forFeature([{name: Model.name, schema: ModelSchema}]),
  ],
  controllers: [ModelController],
  providers: [ModelService],
  exports: [ModelService],
})
export class ModelsModule {}
