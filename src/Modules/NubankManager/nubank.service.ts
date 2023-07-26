import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common'
import * as cron from 'node-cron'
import {InjectModel} from '@nestjs/mongoose'
import {Model} from 'mongoose'
import {ExtractNubankDto} from './dto/nubank.dto'
import {ExtractNubankFilterDto} from './dto/nubank.filter.dto'
import {ExtractNubank, ExtractNubankDocument} from './entities/nubank.entity'
import * as fs from 'fs'
import * as readline from 'readline'
import {google, Auth} from 'googleapis'
import * as path from 'path'
import {format, subDays} from 'date-fns'
import readCSVFile from 'src/Automations/Nubank/functions/ReactFileCSV'
import {readEmailsWithAttachments} from 'src/Automations/Nubank'
import {setTimeout} from 'timers/promises'
import {isDevelopmentEnvironment} from 'src/Common/Functions'
import readCSVFiles from 'src/Automations/Nubank/functions/ReactFileCSV'

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
  ) {}

  async deleteCSVFile() {
    try {
      const folderPath = path.join('dist', 'Modules', 'files_gmail_nubank')
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
      this.logger.error(err)
    }
  }

  /**
   * @description
   * Extrai os emails dos ultimos 7 dias com contem anexo .csv
   */
  async onModuleInit() {
    cron.schedule('*/1 * * * *', async () => {
      if (!isDevelopmentEnvironment()) {
        try {
          this.logger.debug(
            '[SISTEMA] - Iniciando a extracao do extrado do nubank...',
          )
          await readEmailsWithAttachments()
          const dataReadable = await readCSVFiles()
          dataReadable.forEach(async (extract) => {
            const hasExtract = await this.findOne(
              String(extract.Identificador).trim(),
            )
            if (!hasExtract) {
              this.create({
                dateIn: extract.Data,
                description: extract['Descrição'],
                id: extract.Identificador,
                value: String(extract.Valor),
              })
            }
          })
          if (dataReadable.length) {
            await this.deleteCSVFile()
            this.logger.debug('[SISTEMA] - Procedimento finalizado.')
          }
        } catch (err) {
          this.logger.error(err)
        }
      }
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
