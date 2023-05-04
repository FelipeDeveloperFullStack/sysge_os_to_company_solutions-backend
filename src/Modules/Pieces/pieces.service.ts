import {HttpException, HttpStatus, Injectable} from '@nestjs/common'
import {InjectModel} from '@nestjs/mongoose'
import {Model} from 'mongoose'
import {PieceDto} from './dto/piece.dto'
import {PieceFilterDto} from './dto/piece.filter.dto'
import {Piece, PieceDocument} from './entities/piece.entity'

@Injectable()
export class PiecesService {
  constructor(
    @InjectModel(Piece.name)
    private pieceModel: Model<PieceDocument>,
  ) {}

  async checkIFPieceAlreadyExists(service: PieceDto) {
    const result = await this.pieceModel.findOne({
      description: service.description,
    })
    if (result) {
      return false
    }
    return true
  }

  async getTotalOrderPieces() {
    const result = await this.pieceModel.find()
    return {total: result?.length}
  }

  async create(createPieceDto: PieceDto) {
    createPieceDto = {
      ...createPieceDto,
      description: String(createPieceDto.description).toUpperCase(),
    }
    const piece = new this.pieceModel(createPieceDto)

    const resultlreadyExists = await this.checkIFPieceAlreadyExists(
      createPieceDto,
    )

    if (resultlreadyExists) {
      try {
        piece.save()
        return {
          status: HttpStatus.CREATED,
        }
      } catch (error) {
        throw new HttpException(
          {
            message: error,
          },
          HttpStatus.FORBIDDEN,
        )
      }
    } else {
      throw new HttpException(
        {
          message: 'Já existe uma peça cadastrada com esse nome.',
        },
        HttpStatus.FORBIDDEN,
      )
    }
  }

  async findAll(pieceFilter: PieceFilterDto) {
    const piece = {
      description: new RegExp(pieceFilter.description, 'i'),
      // value: new RegExp(String(pieceFilter.value), 'i'),
    }
    return await this.pieceModel.find(piece)
  }

  async findOne(id: string) {
    return await this.pieceModel.findOne({_id: id})
  }

  async update(id: string, updatePieceDto: PieceDto) {
    try {
      await this.pieceModel.updateOne(
        {
          _id: id,
        },
        {
          $set: {
            description: String(updatePieceDto.description).toUpperCase(),
            value: updatePieceDto.value,
          },
        },
      )
      return {
        status: HttpStatus.OK,
      }
    } catch (error) {
      throw new HttpException(
        {
          message: error,
        },
        HttpStatus.EXPECTATION_FAILED,
      )
    }
  }

  async remove(id: string) {
    try {
      await this.pieceModel.deleteOne({_id: id})
      return {
        status: HttpStatus.CREATED,
      }
    } catch (error) {
      throw new HttpException(
        {
          message: error,
        },
        HttpStatus.EXPECTATION_FAILED,
      )
    }
  }
}
