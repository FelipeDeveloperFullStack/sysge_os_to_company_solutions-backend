import {HttpException, HttpStatus, Injectable} from '@nestjs/common'
import {InjectModel} from '@nestjs/mongoose'
import {Model} from 'mongoose'
import {ModelDto} from './dto/model.dto'
import {ModelFilterDto} from './dto/model.filter.dto'
import {Model as _Model, ModelDocument} from './entities/model.entity'

@Injectable()
export class ModelService {
  constructor(
    @InjectModel(_Model.name)
    private modelModel: Model<ModelDocument>,
  ) {}

  async create(createModelDto: ModelDto) {
    createModelDto = {
      ...createModelDto,
      description: String(createModelDto.description).toUpperCase(),
    }
    const model = new this.modelModel(createModelDto)

    try {
      model.save()
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
  }

  async findAll(modelFilter: ModelFilterDto) {
    const service = {
      description: new RegExp(modelFilter.description, 'i'),
    }
    return await this.modelModel.find(service)
  }

  async findOne(id: string) {
    return await this.modelModel.findOne({_id: id})
  }

  async update(id: string, updateModelDto: ModelDto) {
    try {
      await this.modelModel.updateOne(
        {
          _id: id,
        },
        {
          $set: {
            description: String(updateModelDto.description).toUpperCase(),
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
      await this.modelModel.deleteOne({_id: id})
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
