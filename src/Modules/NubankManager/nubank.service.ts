import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common'
import {InjectModel} from '@nestjs/mongoose'
import {subDays} from 'date-fns'
import * as fs from 'fs'
import {Auth, google} from 'googleapis'
import {Model} from 'mongoose'
import * as cron from 'node-cron'
import * as path from 'path'
import * as readline from 'readline'
import {readEmailsWithAttachments} from 'src/Automations/Nubank'
import {
  default as readCSVFile,
  default as readCSVFiles,
} from 'src/Automations/Nubank/functions/ReactFileCSV'
import {isDevelopmentEnvironment} from 'src/Common/Functions'
import {formatInputPrice, formatPrice} from 'src/Common/Helpers/formatPrice'
import {ClientsService} from '../Clients/clients.service'
import {ConfigurationSystemService} from '../Configurations/configurations.service'
import {ExpenseService} from '../Expense/expenses.service'
import {ServiceDto} from '../OrderService/dto/service.dto'
import {ServiceService} from '../OrderService/services.service'
import {ExtractNubankDto} from './dto/nubank.dto'
import {ExtractNubankFilterDto} from './dto/nubank.filter.dto'
import {ExtractNubank, ExtractNubankDocument} from './entities/nubank.entity'

@Injectable()
export class ExtractNubankService implements OnModuleInit {
  private SCOPES = ['https://www.googleapis.com/auth/gmail.readonly']
  private PORT = 3005
  private REDIRECT_URL = `http://localhost:${this.PORT}`
  private TOKEN_FILE_GMAIL = 'token_gmail.json'
  private logger = new Logger()

  constructor(
    @InjectModel(ExtractNubank.name)
    private nubankModel: Model<ExtractNubankDocument>,
    private readonly expense: ExpenseService,
    private readonly orderService: ServiceService,
    private readonly client: ClientsService,
    private readonly configurationSystemService: ConfigurationSystemService,
  ) {}

  async deleteCSVFile() {
    const folderPath = path.join('dist', 'Modules', 'files_gmail_nubank')
    if (fs.existsSync(folderPath)) {
      try {
        const extension = '.csv'
        const files = await fs.promises.readdir(folderPath)
        for (const file of files) {
          if (path.extname(file) === extension) {
            const filePath = path.join(folderPath, file)
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath)
              console.log(`[SISTEMA] - Arquivo ${file} excluído com sucesso.`)
            }
          }
        }
      } catch (err) {
        this.logger.error('Erro aqui', err)
      }
    }
  }

  async extractCPF(inputString: string) {
    const cpfRegex = /(\d{3}\.\d{3}\.\d{3}-\d{2})/
    const cpfMatches = inputString.match(cpfRegex)

    if (cpfMatches) {
      return cpfMatches[1]
    }

    return null
  }

  async extractCNPJ(inputString: string) {
    const cnpjRegex = /(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})/
    const cnpjMatches = inputString.match(cnpjRegex)

    if (cnpjMatches) {
      return cnpjMatches[1]
    }

    return null
  }

  async extractName(inputString: string) {
    const nameRegex = /-\s*([^0-9-].+)/ // Exclui números, traços e hífens do início
    const nameMatches = inputString.match(nameRegex)
    const namePattern = /^[A-ZÀ-ÖØ-Þ][A-Za-zÀ-ÖØ-Þ\s]+-\s/
    if (nameMatches) {
      const nameMatch = nameMatches[1]?.trim().match(namePattern)
      if (nameMatch) {
        const name = nameMatch[0].replace(/-\s$/, '').trim()
        return String(name).toUpperCase()
      }
    }
    return ''
  }

  async clearName(cnpjCpf: string, name: string) {
    return name.replace(cnpjCpf, '').replace('-', '').trim()
  }

  async extractNameAndCpfCnpj(inputString: string) {
    const cpf = await this.extractCPF(inputString)
    const cnpj = await this.extractCNPJ(inputString)
    const name = await this.clearName(
      cnpj || cpf,
      await this.extractName(inputString),
    )
    return {
      cpf: cpf?.trim(),
      cnpj: cnpj?.trim(),
      name: name?.trim(),
    }
  }

  async getOldestOS(osArray: any[]) {
    if (osArray?.length === 0) {
      return []
    }

    const sortedOSArray = osArray.sort((a, b) => {
      const osNumberA = parseInt(a.osNumber)
      const osNumberB = parseInt(b.osNumber)

      return osNumberA - osNumberB
    })

    return [sortedOSArray[0]]
  }

  async compareQuantityRegisters(
    resultOrderService: any[],
    clientId: any,
    totalValueIncomeExtract: number,
  ) {
    const resultOrderServiceSystem = resultOrderService.filter((item) => {
      const {clean} = formatInputPrice(item?.total)
      if (item.status === 'PENDENTE' && clean === totalValueIncomeExtract) {
        if (item.client.id === clientId) {
          return item
        }
      }
    })
    return {
      resultOrderServiceSystem,
    }
  }

  async updateStatusOrderServiceAndSendMessageWhatsapp(
    clientId: string,
    resultOrderService: any[],
    totalValueIncomeExtract: number,
    idExtractIncome: string,
  ) {
    try {
      const resultOrderServiceSystem = resultOrderService.filter((item) => {
        const {clean} = formatInputPrice(item?.total)
        if (item.status === 'PENDENTE' && clean === totalValueIncomeExtract) {
          if (item.client.id === clientId) {
            return item
          }
        }
      })
      const resultOSFiltered = await this.getOldestOS(resultOrderServiceSystem)
      resultOSFiltered.forEach(
        async (item: {
          id: string
          client: {name: string}
          osNumber: string
          total: string
        }) => {
          try {
            const serviceDto: ServiceDto = {
              status: 'PAGO',
            } as ServiceDto
            await this.orderService.update(item?.id, serviceDto)

            await this.updateIncomeDownloaded(idExtractIncome, true)

            const message = `✅ Pagamento Recebido ✅ \n*Cliente:* ${item?.client?.name} \n*OS Nª:* ${item?.osNumber} \n*Valor:* ${item?.total}`
            await this.configurationSystemService.sendMessageGroup(
              '120363169904240571@g.us',
              message,
            )
          } catch (err) {
            this.logger.error(err)
          }
        },
      )
    } catch (error) {}
  }

  async cancelThePayment(
    totalValueIncomeExtract: number,
    description: string,
    idExtractIncome: string,
  ) {
    const hasIncomeDownloaded = await this.findOne(idExtractIncome)

    if (!hasIncomeDownloaded?.isIncomeDownloaded) {
      const {cpf, cnpj, name} = await this.extractNameAndCpfCnpj(description)
      if (cpf || cnpj) {
        const resultOrderService = await this.orderService.findAllWithoutParam()
        const resultClient = await this.client.findCpfOrCnpj(cpf || cnpj)
        const clientId = resultClient?.id
        if (clientId) {
          await this.updateStatusOrderServiceAndSendMessageWhatsapp(
            clientId,
            resultOrderService,
            totalValueIncomeExtract,
            idExtractIncome,
          )
        }
      } else if (name) {
        const resultOrderService = await this.orderService.findAllWithoutParam()
        const resultClient = await this.client.findByName(name)
        const clientId = resultClient?.id
        if (clientId) {
          await this.updateStatusOrderServiceAndSendMessageWhatsapp(
            clientId,
            resultOrderService,
            totalValueIncomeExtract,
            idExtractIncome,
          )
        }
      }
    }
  }

  async extractDataNubankEmail() {
    try {
      this.logger.debug(
        '[SISTEMA] - Iniciando a extracao do extrado do nubank...',
      )
      await readEmailsWithAttachments()

      const dataReadablePositive = await readCSVFiles(true)
      dataReadablePositive?.forEach(async (extract) => {
        const hasExtract = await this.nubankModel.findOne({
          id: extract.Identificador,
        })
        if (!hasExtract) {
          await this.create({
            dateIn: extract.Data,
            description: extract['Descrição'],
            id: extract.Identificador,
            value: String(extract.Valor),
          })
        }
        await this.cancelThePayment(
          extract.Valor,
          extract['Descrição'],
          extract.Identificador,
        )
      })

      const dataReadableNegative = await readCSVFiles(false)
      dataReadableNegative?.forEach(async (extract) => {
        // const hasExtract = await this.expense.findOneIdNubank(
        //   String(extract.Identificador).trim(),
        // )
        await this.expense.removeByIdNubank(
          String(extract.Identificador).trim(),
        )
        const formated = formatPrice(extract.Valor * -1)
        this.expense.create(
          {
            dateIn: extract.Data,
            expense: extract['Descrição'],
            maturity: '',
            status: 'PAGO',
            value: formated,
            user: 'NUBANK',
            idNubank: extract.Identificador,
          },
          'NUBANK',
        )
        // if (!hasExtract) {}
      })
      if (dataReadableNegative?.length) {
        await this.deleteCSVFile()
        this.logger.debug('[SISTEMA] - Procedimento finalizado.')
      }
    } catch (err) {
      this.logger.error(err)
    }
  }

  /**
   * @description
   * Extrai os emails dos ultimos 7 dias com contem anexo .csv
   * Todos os dias as 5 horas da manha.
   */
  async onModuleInit() {
    const oneMinuteDevelopment = '*/1 * * * *'
    //const fiveHourInTheMorning = '0 5 * * *'
    const fiveHourInTheMorning = '*/5 * * * *'
    const halfAnHour = '0 12 * * *'
    const sixHour = '0 18 * * *'
    const tenHour = '0 22 * * *'

    cron.schedule(oneMinuteDevelopment, async () => {
      if (isDevelopmentEnvironment()) {
        await this.extractDataNubankEmail()
      }
    })

    cron.schedule(fiveHourInTheMorning, async () => {
      await this.extractDataNubankEmail()
    })
    cron.schedule(halfAnHour, async () => {
      await this.extractDataNubankEmail()
    })
    cron.schedule(sixHour, async () => {
      await this.extractDataNubankEmail()
    })
    cron.schedule(tenHour, async () => {
      await this.extractDataNubankEmail()
    })
  }

  async create(extract: ExtractNubankDto) {
    extract = {
      ...extract,
      dateIn: extract.dateIn,
      value: extract.value,
      id: String(extract.id).trim(),
      description: String(extract.description).toUpperCase(),
    }
    const extractNumbank = new this.nubankModel(extract)

    try {
      extractNumbank.save()
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

  async updateIncomeDownloaded(id: string, isIncomeDownloaded: boolean) {
    try {
      await this.nubankModel.updateOne(
        {
          id,
        },
        {
          $set: {
            isIncomeDownloaded,
          },
        },
      )
      return {
        status: HttpStatus.OK,
      }
    } catch (error) {
      this.logger.error(error)
    }
  }

  async findAll(modelFilter: ExtractNubankFilterDto) {
    const extractNubank = {
      equipamentName: new RegExp(modelFilter.dateIn, 'i'),
      brand: new RegExp(modelFilter.description, 'i'),
      model: new RegExp(modelFilter.value, 'i'),
    }
    return await this.nubankModel.find(extractNubank)
  }

  async findOne(id: string) {
    return await this.nubankModel.findOne({id})
  }

  async remove(id: string) {
    try {
      await this.nubankModel.deleteOne({_id: id})
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

  async authenticate(): Promise<Auth.OAuth2Client> {
    const CREDENTIALS_DEVELOPMENT = path.resolve(
      'secret_google_drive/client_secret_gmail_development.json',
    )
    const credentials = JSON.parse(
      fs.readFileSync(CREDENTIALS_DEVELOPMENT).toString(),
    )
    //const credentials = JSON.parse(fs.readFileSync('credentials.json', 'utf8'))

    const {client_id, client_secret, redirect_uris} = credentials.web

    const oAuth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uris[0],
    )

    if (fs.existsSync(this.TOKEN_FILE_GMAIL)) {
      const token = fs.readFileSync(this.TOKEN_FILE_GMAIL, 'utf8')
      oAuth2Client.setCredentials(JSON.parse(token))
      return oAuth2Client
    } else {
      return this.getNewToken(oAuth2Client)
    }
  }

  async getNewToken(
    oAuth2Client: Auth.OAuth2Client,
  ): Promise<Auth.OAuth2Client> {
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: this.SCOPES,
    })

    console.log('Authorize this app by visiting the following URL:')
    console.log(authUrl)

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })

    return new Promise((resolve, reject) => {
      rl.question('Enter the code from that page here: ', async (code) => {
        rl.close()
        try {
          const {tokens} = await oAuth2Client.getToken(code)
          oAuth2Client.setCredentials(tokens)
          fs.writeFileSync(this.TOKEN_FILE_GMAIL, JSON.stringify(tokens))
          console.log('Token stored successfully.')
          resolve(oAuth2Client)
        } catch (error) {
          console.error('Error retrieving access token:', error)
          reject(error)
        }
      })
    })
  }

  async downloadAttachments(auth: Auth.OAuth2Client, message: any) {
    const gmail = google.gmail({version: 'v1', auth})

    const attachments = message.payload.parts?.filter(
      (part: any) => part.filename && part.filename.endsWith('.csv'),
    )

    if (attachments && attachments.length > 0) {
      for (const attachment of attachments) {
        const attachmentId = attachment.body?.attachmentId
        if (attachmentId) {
          const response = await gmail.users.messages.attachments.get({
            userId: 'me',
            messageId: message.id,
            id: attachmentId,
          })

          const data = response.data
          const fileData = data.data
          const filename = attachment.filename

          if (fileData) {
            //const fileBuffer = Buffer.from(fileData, 'base64')
            // const filePath = `${destFolder}/${filename}`
            const folderPath = path.join(
              'dist',
              'Modules',
              'files_gmail_nubank',
            )
            if (!fs.existsSync(folderPath)) {
              fs.mkdirSync(folderPath)
            }
            const filePath = path.join(
              'dist',
              'Modules',
              'files_gmail_nubank',
              filename,
            )
            const csvFile = fileData.split(';base64,').pop()
            new Promise<void>((resolve, reject) => {
              fs.writeFile(filePath, csvFile, {encoding: 'base64'}, (err) => {
                if (err) {
                  reject(err)
                } else {
                  resolve()
                }
              })
            })
            //fs.writeFileSync(folderPath, fileBuffer)
            console.log(`Attachment saved: ${filePath}`)

            const dataReadable = await readCSVFile()
          }
        }
      }
    }
  }

  async readEmailsWithAttachments() {
    try {
      const auth = await this.authenticate()
      const gmail = google.gmail({version: 'v1', auth})

      // Get the current date
      const yesterday = subDays(new Date(), 1)

      //const currentDate = format(yesterday, 'yyyy-MM-dd')
      const currentDate = new Date().toISOString().split('T')[0]

      const res = await gmail.users.messages.list({
        userId: 'me',
        q: `is:unread after:${currentDate} has:attachment from:solution.financeiro2012@gmail.com filename:csv`,
        //q: 'has:attachment from:solution.financeiro2012@gmail.com filename:csv',
      })

      const messages = res.data.messages
      if (messages && messages.length > 0) {
        for (const message of messages) {
          const messageDetails = await gmail.users.messages.get({
            userId: 'me',
            id: message.id,
          })

          await this.downloadAttachments(auth, messageDetails.data)

          // Mark the message as read
          // await gmail.users.messages.modify({
          //   userId: 'me',
          //   id: message.id,
          //   requestBody: {
          //     removeLabelIds: ['UNREAD'],
          //   },
          // })
        }
      }
    } catch (error) {
      console.error('Error reading emails:', error)
    }
  }

  async start() {
    await this.readEmailsWithAttachments()
  }
}
