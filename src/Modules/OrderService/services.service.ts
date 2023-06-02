import {HttpException, HttpStatus, Injectable} from '@nestjs/common'
import {InjectModel} from '@nestjs/mongoose'
import {Model} from 'mongoose'
import {ServiceDto} from './dto/service.dto'
import {ServiceFilterDto} from './dto/service.filter.dto'
import {OrderService, ServiceDocument} from './entities/service.entity'
import * as fs from 'fs'
import * as path from 'path'
import {formatInputPrice} from 'src/Common/Helpers/formatPrice'
import {createFolder, listFolder, about} from './googleDrive/gdrive'

@Injectable()
export class ServiceService {
  constructor(
    @InjectModel(OrderService.name)
    private serviceModel: Model<ServiceDocument>,
  ) {}

  async create(createServiceDto: ServiceDto) {
    const service = new this.serviceModel(createServiceDto)

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
  }

  async findAll(serviceFilter: ServiceFilterDto) {
    const service = {
      description: new RegExp(serviceFilter.clientName, 'i'),
      // status: 'PENDENTE',
      //laudoService: new RegExp(serviceFilter.laudoService, 'i'),
    }
    return await this.serviceModel.find(service)
  }

  async getTotalOrderService() {
    const result = await this.serviceModel.find()
    return {total: result?.length}
  }

  async getSumTotalIncomes() {
    const result = await this.serviceModel.find()
    const total = result.reduce((acc, item) => {
      const {clean} = formatInputPrice(item?.total)
      if (item.status === 'PAGO') {
        return acc + clean
      } else {
        return acc
      }
    }, 0)
    return {total: total}
  }

  async findOne(id: string) {
    return await this.serviceModel.findOne({_id: id})
  }

  async update(id: string, updateServiceDto: ServiceDto) {
    try {
      await this.serviceModel.updateOne(
        {
          _id: id,
        },
        {
          $set: updateServiceDto,
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

  async savePDF(base64: string, filename: string): Promise<void> {
    try {
      const folderPath = path.join(__dirname, '..', 'pdfs')
      // Cria o diretório "pdfs" caso ele não exista
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath)
      }
      const filePath = path.join(__dirname, '..', 'pdfs', filename)
      const pdfData = base64.split(';base64,').pop()
      const createFolderREsult = await createFolder({
        folderName: 'CLIENTES',
        parents: '1_GPF7MiJfF4z2zYW5qsnUPP6ePaidydV',
      })
      const listResult = await listFolder({
        parents: '1_GPF7MiJfF4z2zYW5qsnUPP6ePaidydV',
      })
      // const aboutResult = await about()
      console.log({createFolderREsult})

      /**
       * @description Converte o base64 em arquivo .pdf
       */
      return new Promise<void>((resolve, reject) => {
        fs.writeFile(
          filePath.concat('.pdf'),
          pdfData,
          {encoding: 'base64'},
          (err) => {
            if (err) {
              reject(err)
            } else {
              resolve()
            }
          },
        )
      })
    } catch (error) {
      console.log(error)
      throw new HttpException(
        {
          message: error,
        },
        HttpStatus.EXPECTATION_FAILED,
      )
    }
  }
}
