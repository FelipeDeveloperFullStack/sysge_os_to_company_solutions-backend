import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common'
import {PieceDto} from './dto/piece.dto'
import {PieceFilterDto} from './dto/piece.filter.dto'
import {PiecesService} from './pieces.service'

@Controller('pieces')
export class PieceController {
  constructor(private readonly piecesService: PiecesService) {}

  @Post()
  create(@Body() createPieceDto: PieceDto) {
    return this.piecesService.create(createPieceDto)
  }

  @Post('register')
  registerExpenseInPiece(@Body() createPieceDto: PieceDto) {
    return this.piecesService.create(createPieceDto, true)
  }

  @Get('total')
  getTotal() {
    return this.piecesService.getTotalOrderPieces()
  }

  @Get()
  findAll(@Query() pieceParam: PieceFilterDto) {
    return this.piecesService.findAll(pieceParam)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.piecesService.findOne(id)
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updatePieceDto: PieceDto) {
    return this.piecesService.update(id, updatePieceDto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.piecesService.remove(id)
  }
}
