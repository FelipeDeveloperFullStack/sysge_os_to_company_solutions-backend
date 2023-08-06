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
import {SocketService} from 'src/Socket/socket.service'
import {CONNECTION_UPDATE, QRCODE_UPDATED} from 'src/Contants'
import axios from 'axios'
import * as fs from 'fs'

@Injectable()
export class ConfigurationSystemService {
  private logger = new Logger()

  constructor(
    @InjectModel(ConfigurationSystem.name)
    private configurationSystemModel: Model<ConfigurationSystemDocument>,
    private readonly socketService: SocketService,
  ) {}

  async webhook(response: any) {
    console.log({eventWebHook: response?.event})
    if (response?.event === QRCODE_UPDATED) {
      const data = {
        event: response.event,
        base64: response?.data?.qrcode?.base64,
      }
      const io = this.socketService.getIo()
      io.emit(QRCODE_UPDATED, data)
    }
    if (response?.event === CONNECTION_UPDATE) {
      const data = {
        event: response.event,
        state: response?.data?.state,
        stateReason: response?.data?.statusReason,
      }
      const io = this.socketService.getIo()
      io.emit(CONNECTION_UPDATE, data)
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

  async readIPFromFile() {
    try {
      const data = fs.readFileSync('ip.json', 'utf-8')
      const ipData = JSON.parse(data)
      return ipData?.ip
    } catch (error) {
      this.logger.error(error)
    }
  }

  async createInstance(ip: string, instanceName: string) {
    try {
      const {data} = await axios.post(
        `http://${ip}:8083/instance/create`,
        {
          instanceName,
        },
        {
          headers: {
            apiKey: process.env.API_KEY_WHATSAPP,
          },
        },
      )
      return data?.hash?.jwt
    } catch (error) {
      throw error
    }
  }
  async getQrCode(ip: string, instanceName: string, jwt: string) {
    try {
      await axios.get(`http://${ip}:8083/instance/connect/${instanceName}`, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      })
    } catch (error) {
      throw error
    }
  }
  async setInstance(instanceName: string, ip: string, jwt: string) {
    try {
      await axios.post(
        `http://${ip}:8083/webhook/set/${instanceName}`,
        {
          enabled: true,
          url: `http://${ip}:3005/configurations`,
        },
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        },
      )
    } catch (error) {
      throw error
    }
  }

  async connectWhatsapp() {
    let ip = undefined
    const instanceName = String(Math.random())
    if (fs.existsSync('ip.json')) {
      ip = await this.readIPFromFile()
    }
    if (ip) {
      const jwt = await this.createInstance(ip, instanceName)
      // await this.setInstance(instanceName, ip, jwt)
      await this.getQrCode(ip, instanceName, jwt)
    }
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
