import {HttpException, HttpStatus, Injectable} from '@nestjs/common'
import {InjectModel} from '@nestjs/mongoose'
import {Model} from 'mongoose'
import {EquipamentDto} from './dto/equipament.dto'
import {EquipamentFilterDto} from './dto/equipament.filter.dto'
import {Equipament, EquipamentDocument} from './entities/equipament.entity'

@Injectable()
export class EquipamentService {
  constructor(
    @InjectModel(Equipament.name)
    private equipamentModel: Model<EquipamentDocument>,
  ) {}

  async getTotalEquipaments() {
    const result = await this.equipamentModel.find()
    return {total: result?.length}
  }

  async create(createEquipamentDto: EquipamentDto) {
    createEquipamentDto = {
      ...createEquipamentDto,
      equipamentName: String(createEquipamentDto.equipamentName).toUpperCase(),
      brand: String(createEquipamentDto.brand).toUpperCase(),
      model: String(createEquipamentDto.model).toUpperCase(),
      serialNumber: String(createEquipamentDto.serialNumber).toUpperCase(),
    }
    const equipament = new this.equipamentModel(createEquipamentDto)

    try {
      equipament.save()
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

  async findAll(modelFilter: EquipamentFilterDto) {
    const service = {
      equipamentName: new RegExp(modelFilter.equipamentName, 'i'),
      brand: new RegExp(modelFilter.brand, 'i'),
      model: new RegExp(modelFilter.model, 'i'),
      serialNumber: new RegExp(modelFilter.serialNumber, 'i'),
    }
    return await this.equipamentModel.find(service)
  }

  async findOne(id: string) {
    return await this.equipamentModel.findOne({_id: id})
  }

  async update(id: string, updateEquipamentDto: EquipamentDto) {
    try {
      await this.equipamentModel.updateOne(
        {
          _id: id,
        },
        {
          $set: {
            equipamentName: String(
              updateEquipamentDto.equipamentName,
            ).toUpperCase(),
            brand: String(updateEquipamentDto.brand).toUpperCase(),
            model: String(updateEquipamentDto.model).toUpperCase(),
            serialNumber: String(
              updateEquipamentDto.serialNumber,
            ).toUpperCase(),
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
      await this.equipamentModel.deleteOne({_id: id})
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
