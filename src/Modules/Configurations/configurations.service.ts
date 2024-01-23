import {HttpException, HttpStatus, Injectable, Logger} from '@nestjs/common'
import {InjectModel} from '@nestjs/mongoose'
import axios from 'axios'
import * as fs from 'fs'
import {Model} from 'mongoose'
import * as os from 'os'
import * as path from 'path'
import {isDevelopmentEnvironment} from 'src/Common/Functions'
import {getGreeting} from 'src/Common/Helpers/getGreeting'
import {getLocalIP} from 'src/Common/Helpers/localIP'
import {CONNECTION_UPDATE, QRCODE_UPDATED} from 'src/Contants'
import {SocketService} from 'src/Socket/socket.service'
import {promisify} from 'util'
import {ConfigurationSystemDto} from './dto/configurations.dto'
import {
  ConfigurationSystem,
  ConfigurationSystemDocument,
} from './entities/configurations.entity'
import {getPublicIP} from 'src/Common/Helpers/publicIP'

type MimeType =
  | 'text/plain'
  | 'image/jpeg'
  | 'application/pdf'
  | 'audio/mp3'
  | 'video/mp4'

type FileType = {
  base64: string
  fileName: string
  path: string
  file?: Buffer
}

interface SimulatedFile {
  path: string
  name: string
  type: MimeType
}

@Injectable()
export class ConfigurationSystemService {
  private logger = new Logger()
  private writeFileAsync = promisify(fs.writeFile)

  constructor(
    @InjectModel(ConfigurationSystem.name)
    private configurationSystemModel: Model<ConfigurationSystemDocument>,
    private readonly socketService: SocketService,
  ) {}

  async defineWebhook(data: any) {
    try {
      let token = undefined
      let ip = undefined
      let instanceName = undefined
      let jwt = undefined
      ip = getLocalIP()
      if (fs.existsSync('token_whatsapp.json')) {
        token = await this.readTokenFromFile()
        instanceName = token?.instanceName
        jwt = token?.jwt
      } else {
        instanceName = String(Math.random())
        jwt = await this.createInstance(ip, instanceName)
        await this.writeFileAsync(
          'token_whatsapp.json',
          JSON.stringify({jwt, instanceName}),
        )
      }
      await axios.put(
        `http://${ip}:8084/webhook/set/${instanceName}`,
        {
          enabled: true,
          url: `http://${data.publicIP}:3005/configurations`,
          events: {
            qrcodeUpdated: true,
            messagesSet: false,
            messagesUpsert: true,
            messagesUpdated: true,
            sendMessage: true,
            contactsSet: true,
            contactsUpsert: true,
            contactsUpdated: true,
            chatsSet: false,
            chatsUpsert: true,
            chatsUpdated: true,
            chatsDeleted: true,
            presenceUpdated: true,
            groupsUpsert: false,
            groupsUpdated: false,
            groupsParticipantsUpdated: false,
            connectionUpdated: true,
            statusInstance: true,
            refreshToken: true,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        },
      )
      return {message: 'Webhook adicionado com sucesso.', status: 200}
    } catch (error) {
      throw new HttpException(
        {
          message: error,
        },
        HttpStatus.EXPECTATION_FAILED,
      )
    }
  }
  async getStatusWebhook() {
    try {
      let token = undefined
      let ip = undefined
      let jwt = undefined
      let instanceName = undefined
      ip = getLocalIP()

      if (fs.existsSync('token_whatsapp.json')) {
        token = await this.readTokenFromFile()
        instanceName = token?.instanceName
        jwt = token?.jwt
      } else {
        instanceName = String(Math.random())
        jwt = await this.createInstance(ip, instanceName)
        await this.writeFileAsync(
          'token_whatsapp.json',
          JSON.stringify({jwt, instanceName}),
        )
      }

      const {data} = await axios.get(
        `http://${ip}:8084/webhook/find/${instanceName}`,
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        },
      )
      if (!data) return {message: 'Nenhum webhook configurado', status: 404}
      return data
    } catch (error) {
      throw new HttpException(
        {
          message: error,
        },
        HttpStatus.EXPECTATION_FAILED,
      )
    }
  }

  async webhook(response: any) {
    if (response?.event === QRCODE_UPDATED) {
      const data = {
        event: response.event,
        base64: response?.data?.qrcode?.base64,
      }
      const io = this.socketService.getIo()
      io?.emit(QRCODE_UPDATED, data)
    }
    if (response?.event === CONNECTION_UPDATE) {
      const data = {
        event: response.event,
        state: response?.data?.state,
        stateReason: response?.data?.statusReason,
      }
      const io = this.socketService.getIo()
      io?.emit(CONNECTION_UPDATE, data)
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

  async createGroupNotification() {
    try {
      let token = undefined
      let ip = undefined
      if (fs.existsSync('token_whatsapp.json')) {
        token = await this.readTokenFromFile()
      }
      if (isDevelopmentEnvironment()) {
        //ip = getLocalIP() // Development virtual machine
        ip = getLocalIP()
      } else {
        ip = getLocalIP()
      }
      let instanceName = token?.instanceName
      let jwt = token?.jwt
      const {data} = await axios.post(
        `http://${ip}:8084/group/create/${instanceName}`,
        {
          subject: 'Notificações - Solutions',
          description: 'Notificações do sistema - Solutions',
          participants: ['5562982370218', '5521996019608'],
        },
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        },
      )
      return data
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
  async readTokenFromFile() {
    try {
      const data = fs.readFileSync('token_whatsapp.json', 'utf-8')
      const tokenData = JSON.parse(data)
      return tokenData
    } catch (error) {
      this.logger.error(error)
    }
  }

  async createInstance(ip: string, instanceName: string) {
    try {
      const {data} = await axios.post(
        `http://${ip}:8084/instance/create`,
        {
          instanceName,
          description: instanceName,
        },
        {
          headers: {
            apiKey: process.env.API_KEY_WHATSAPP,
          },
        },
      )

      //return data?.hash?.jwt
      return data?.Auth?.token
    } catch (error) {
      console.log(error)
      throw error
    }
  }

  async getConnectionStatus(ip: string, instanceName: string, jwt: string) {
    try {
      const {data} = await axios.get(
        `http://${ip}:8084/instance/connectionState/${instanceName}`,
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        },
      )
      return data
    } catch (error) {
      throw error
    }
  }

  async getQrCode(ip: string, instanceName: string, jwt: string) {
    try {
      await axios.get(`http://${ip}:8084/instance/connect/${instanceName}`, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      })
    } catch (error) {
      throw error
    }
  }
  // async setInstance(instanceName: string, ip: string, jwt: string) {
  //   try {
  //     await axios.post(
  //       `http://${ip}:8084/webhook/set/${instanceName}`,
  //       {
  //         enabled: true,
  //         url: `http://${ip}:3005/configurations`,
  //       },
  //       {
  //         headers: {
  //           Authorization: `Bearer ${jwt}`,
  //         },
  //       },
  //     )
  //   } catch (error) {
  //     throw error
  //   }
  // }

  async findFileByOrderNumber(orderNumber: string): Promise<FileType[] | null> {
    const userHomeDir = os.homedir()
    const folderPath = path.join(userHomeDir, 'boletos')

    try {
      const files = fs.readdirSync(folderPath)
      const matchingFiles = files.filter((fileName) => {
        const regex = /\[OS\s+(\d+)\]/i
        const match = fileName.match(regex)
        return match && match[1] === orderNumber
      })

      // If no matching files are found, return null
      if (matchingFiles.length === 0) {
        return null
      }
      // Convert the file names to file paths
      // const filePaths = matchingFiles.map((fileName) => {
      //   return {
      //     path: path.join(folderPath, fileName),
      //     fileName,
      //   }
      // })
      // return filePaths
      const fileDataArray = await Promise.all(
        matchingFiles.map(async (fileName) => {
          const filePath = path.join(folderPath, fileName)
          const fileData = await fs.promises.readFile(filePath)
          const base64Data = fileData.toString('base64')
          const simulatedFile: SimulatedFile = {
            path: filePath,
            name: fileName,
            type: 'application/pdf', // Substitua pelo tipo MIME correto
          }
          return {
            base64: base64Data,
            fileName,
            path: filePath,
            file: fileData,
          }
        }),
      )

      return fileDataArray
    } catch (err) {
      this.logger.error('[SISTEMA] - Error accessing the folder or file:', err)
      return null
    }
  }

  async sendTextToWhatsapp(
    phoneNumber: string,
    ip: string,
    instanceName: string,
    jwt: string,
    osNumber: string,
    isResendNotification?: boolean,
    osNumberToResendNotification?: string[],
  ) {
    try {
      const osPending = osNumberToResendNotification.filter(
        (item) => item !== osNumber,
      )

      const getMessagePendingNotification = () => {
        if (osPending.length > 1) {
          return `${getGreeting()}\n\nEstamos enviando esta notificação via Whatsapp para lembrá-lo de que o boleto referente à ordem de serviço de número *${osNumber}*, o qual ainda não foi liquidado.\n\nAgradecemos sua atenção e pontualidade. ${
            !!osPending?.length
              ? `\n\n*Além disso, informamos que ainda existem as ordens de serviço de número ${osPending.join(
                  ',',
                )} pendentes para pagamento.*`
              : ''
          }\n\nQualquer dúvida, estamos à disposição.\n\nCaso o boleto já esteja pago, por favor, desconsidere essa mensagem.\n\nAtenciosamente.`
        } else {
          return `${getGreeting()}\n\nEstamos enviando esta notificação via Whatsapp para lembrá-lo de que o boleto referente à ordem de serviço de número *${osNumber}*, o qual ainda não foi liquidado.\n\nAgradecemos sua atenção e pontualidade. ${
            !!osPending?.length
              ? `\n\n*Além disso, informamos que ainda existem a orden de serviço de número ${osPending.join(
                  ',',
                )} pendente para pagamento.*`
              : ''
          }\n\nQualquer dúvida, estamos à disposição.\n\nCaso o boleto já esteja pago, por favor, desconsidere essa mensagem.\n\nAtenciosamente.`
        }
      }

      await axios.post(
        `http://${ip}:8084/message/sendText/${instanceName}`,
        {
          number: phoneNumber,
          textMessage: {
            text: !isResendNotification
              ? `${getGreeting()}\n\nEstamos enviando esta notificação via Whatsapp para lembrá-lo de que o boleto referente à ordem de serviço de número *${osNumber}* foi gerado.\n\nAgradecemos sua atenção e pontualidade.\nQualquer dúvida, estamos à disposição.\nCaso o boleto já esteja pago, por favor, desconsidere essa mensagem.\n\nAtenciosamente.`
              : getMessagePendingNotification(),
          },
          options: {
            delay: 1500,
            presence: 'composing',
          },
        },
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        },
      )
    } catch (error) {
      throw new HttpException(
        {
          message: error,
        },
        HttpStatus.EXPECTATION_FAILED,
      )
    }
  }

  async sendAttachmentToWhatsappClientNumber(
    phoneNumber: string,
    instanceName: string,
    ip: string,
    jwt: string,
    fileName: string,
    base64: string,
  ) {
    try {
      const base64Data = base64
      // Decodificar a base64 para um buffer
      const binaryData = Buffer.from(base64Data, 'base64')
      // Criar um objeto Blob a partir do buffer
      const blob = new Blob([binaryData], {type: 'application/pdf'})

      const formData = new FormData()
      formData.append('number', phoneNumber)
      formData.append('caption', ' ')
      formData.append('attachment', blob, fileName) // Replace yourMediaFile with the actual file
      formData.append('mediatype', 'document')
      formData.append('delay', '1500')

      await axios.post(
        `http://${ip}:8084/message/sendMediaFile/${instanceName}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
            'Content-Type': 'multipart/form-data',
          },
        },
      )
    } catch (error) {
      throw new HttpException(
        {
          message: error,
        },
        HttpStatus.EXPECTATION_FAILED,
      )
    }
  }

  async sendMessageGroup(idGroup: string, message: string) {
    try {
      let token = undefined
      let ip = undefined
      if (fs.existsSync('token_whatsapp.json')) {
        token = await this.readTokenFromFile()
      }
      if (isDevelopmentEnvironment()) {
        ip = getLocalIP() // Development virtual machine
      } else {
        ip = getLocalIP()
      }
      let instanceName = token?.instanceName
      let jwt = token?.jwt
      await axios.post(
        `http://${ip}:8084/message/sendText/${instanceName}`,
        {
          number: idGroup,
          textMessage: {
            text: message,
          },
          options: {
            delay: 0,
            presence: 'composing',
          },
        },
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        },
      )
    } catch (error) {}
  }

  async sendMidia(
    phoneNumber?: string,
    osNumber?: string,
    isResendNotification?: boolean,
    osNumberToResendNotification?: string[],
  ) {
    try {
      let token = undefined
      let ip = undefined
      if (fs.existsSync('token_whatsapp.json')) {
        token = await this.readTokenFromFile()
      }
      if (isDevelopmentEnvironment()) {
        ip = getLocalIP() // Development virtual machine
      } else {
        //ip = await getPublicIP()
        ip = 'localhost'
      }
      let instanceName = token?.instanceName
      let jwt = token?.jwt
      const files = await this.findFileByOrderNumber(osNumber)
      try {
        await this.sendTextToWhatsapp(
          phoneNumber,
          ip,
          instanceName,
          jwt,
          osNumber,
          isResendNotification,
          osNumberToResendNotification,
        )
      } catch (error) {
        console.log('Erro ao enviar texto: ', error)
      }
      files.forEach(async (file) => {
        try {
          await this.sendAttachmentToWhatsappClientNumber(
            phoneNumber,
            instanceName,
            ip,
            jwt,
            file.fileName,
            file.base64,
          )
        } catch (error) {
          console.log('Erro ao enviar anexo', error)
        }
      })
      return 'File sended with successfully'
    } catch (error) {
      //console.log(error)
      throw new HttpException(
        {
          message: error,
        },
        HttpStatus.EXPECTATION_FAILED,
      )
    }
  }

  async getStatusConnection() {
    let token = undefined
    let ip = undefined
    if (fs.existsSync('token_whatsapp.json')) {
      token = await this.readTokenFromFile()
    }
    if (fs.existsSync('ip.json')) {
      ip = await this.readIPFromFile()
    }
    if (isDevelopmentEnvironment()) {
      ip = getLocalIP() // Development virtual machine
    }
    if (ip) {
      // ip = getLocalIP()
      let instanceName = token?.instanceName
      let jwt = token?.jwt
      try {
        return await this.getConnectionStatus(ip, instanceName, jwt)
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

  async connectWhatsapp() {
    let ip = undefined
    let token = undefined
    let jwt = undefined
    let instanceName = undefined
    ip = getLocalIP()

    if (fs.existsSync('ip.json')) {
      ip = await this.readIPFromFile()
    }
    // if (isDevelopmentEnvironment()) {
    //   ip = getLocalIP() // Development virtual machine
    // }
    if (fs.existsSync('token_whatsapp.json')) {
      token = await this.readTokenFromFile()
      instanceName = token?.instanceName
      jwt = token?.jwt
    } else {
      instanceName = String(Math.random())
      jwt = await this.createInstance(ip, instanceName)
      await this.writeFileAsync(
        'token_whatsapp.json',
        JSON.stringify({jwt, instanceName}),
      )
    }
    if (ip) {
      try {
        // ip = getLocalIP()
        //const jwt = await this.createInstance(ip, instanceName)
        // await this.setInstance(instanceName, ip, jwt)
        // await this.writeFileAsync(
        //   'token_whatsapp.json',
        //   JSON.stringify({jwt, instanceName}),
        // )
        await this.getQrCode(ip, instanceName, jwt)
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
