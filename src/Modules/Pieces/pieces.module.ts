import {Module} from '@nestjs/common'
import {MongooseModule} from '@nestjs/mongoose'
import {Piece, PieceSchema} from './entities/piece.entity'
import {PieceController} from './pieces.controller'
import {PiecesService} from './pieces.service'

@Module({
  imports: [
    MongooseModule.forFeature([{name: Piece.name, schema: PieceSchema}]),
  ],
  controllers: [PieceController],
  providers: [PiecesService],
  exports: [PiecesService],
})
export class PiecesModule {}
