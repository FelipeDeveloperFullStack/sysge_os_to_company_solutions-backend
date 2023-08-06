import {HttpException, HttpStatus, Injectable, Logger} from '@nestjs/common'
import {InjectModel} from '@nestjs/mongoose'
import {Model} from 'mongoose'
import {ConfigurationSystemDto} from './dto/configurations.dto'
import {
  ConfigurationSystem,
  ConfigurationSystemDocument,
} from './entities/configurations.entity'
import {ExpenseService} from '../Expense/expenses.service'
import {ServiceService} from '../OrderService/services.service'

@Injectable()
export class ConfigurationSystemService {
  private logger = new Logger()

  constructor(
    @InjectModel(ConfigurationSystem.name)
    private configurationSystemModel: Model<ConfigurationSystemDocument>,
  ) {}

  async webhook(response: any) {
    if (response?.event === 'qrcode.updated') {
      console.log({
        state: response?.data?.qrcode,
        stateReason: response?.data?.base64,
      })
    }
    if (response?.event === 'connection.update') {
      console.log({
        state: response?.data?.state,
        stateReason: response?.data?.stateReason,
      })
    }
  }

  async createOrUpdate(config: ConfigurationSystemDto) {
    config = {
      ...config,
      isEnableEmailBilling: config.isEnableEmailBilling,
      isEnableWhatsappBilling: config.isEnableWhatsappBilling,
    }

    const confs = await this.findAll()

    const extractNumbank = new this.configurationSystemModel(config)

    try {
      if (!confs?.length) {
        extractNumbank.save()
      } else {
        await this.update(config, String(confs[0]._id).toString())
      }
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

  async update(config: ConfigurationSystemDto, _id: string) {
    try {
      await this.configurationSystemModel.updateOne(
        {
          _id,
        },
        {
          $set: {
            isEnableEmailBilling: config.isEnableEmailBilling,
            isEnableWhatsappBilling: config.isEnableWhatsappBilling,
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

  async findAll() {
    return await this.configurationSystemModel.find()
  }

  async findOne(id: string) {
    return await this.configurationSystemModel.findOne({id})
  }

  async remove(id: string) {
    try {
      await this.configurationSystemModel.deleteOne({_id: id})
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
