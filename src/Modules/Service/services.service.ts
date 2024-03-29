import {HttpException, HttpStatus, Injectable} from '@nestjs/common'
import {InjectModel} from '@nestjs/mongoose'
import {Model} from 'mongoose'
import {ServiceDto} from './dto/service.dto'
import {ServiceFilterDto} from './dto/service.filter.dto'
import {Service, ServiceDocument} from './entities/service.entity'

@Injectable()
export class ServiceService {
  constructor(
    @InjectModel(Service.name)
    private serviceModel: Model<ServiceDocument>,
  ) {}

  async checkIFServiceAlreadyExists(service: ServiceDto) {
    const result = await this.serviceModel.findOne({
      description: service.description,
    })
    if (result) {
      return false
    }
    return true
  }

  async getTotalService() {
    const result = await this.serviceModel.find()
    return {total: result?.length}
  }

  async create(createServiceDto: ServiceDto, user: string) {
    createServiceDto = {
      ...createServiceDto,
      user,
      description: String(createServiceDto.description.trim()).toUpperCase(),
      laudos: createServiceDto?.laudos?.map((laudo) => laudo),
    }
    const service = new this.serviceModel(createServiceDto)
    const resultAlreadyExists = await this.checkIFServiceAlreadyExists(
      createServiceDto,
    )
    if (resultAlreadyExists) {
      try {
        service.save()
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
          message: 'Já existe um serviço cadastrado com esse nome.',
        },
        HttpStatus.FORBIDDEN,
      )
    }
  }

  async findAll(serviceFilter: ServiceFilterDto) {
    const service = {
      description: new RegExp(serviceFilter.description, 'i'),
      //value: serviceFilter.value,
      //laudoService: new RegExp(serviceFilter.laudoService, 'i'),
    }
    return await this.serviceModel.find(service)
  }

  async findOne(id: string) {
    return await this.serviceModel.findOne({_id: id})
  }

  async update(id: string, updateServiceDto: ServiceDto, user: string) {
    try {
      await this.serviceModel.updateOne(
        {
          _id: id,
        },
        {
          $set: {
            user,
            description: String(updateServiceDto.description).toUpperCase(),
            laudos: updateServiceDto.laudos?.map((laudo) => String(laudo)),
            value: updateServiceDto.value,
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
      await this.serviceModel.deleteOne({_id: id})
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
