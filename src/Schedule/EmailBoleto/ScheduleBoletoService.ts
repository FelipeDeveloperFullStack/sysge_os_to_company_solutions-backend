import {Injectable, Logger} from '@nestjs/common'
import {addDays, format, isSameDay, isWithinInterval, parse} from 'date-fns'
import * as fs from 'fs'
import * as handlebars from 'handlebars'
import {DateTime} from 'luxon'
import * as cron from 'node-cron'
import * as nodemailer from 'nodemailer'
import * as base64ToS3 from 'nodemailer-base64-to-s3'
import * as os from 'os'
import * as path from 'path'
import {isDevelopmentEnvironment} from 'src/Common/Functions'
import {ClientsService} from 'src/Modules/Clients/clients.service'
import {ConfigurationSystemService} from 'src/Modules/Configurations/configurations.service'
import {ServiceService} from 'src/Modules/OrderService/services.service'

type FileType = {
  path: string
  fileName: string
}

@Injectable()
export class ScheduleBoletoService {
  private logger = new Logger()
  private emailTemplate: HandlebarsTemplateDelegate
  private emailTemplateNotificationBoletoPendingContent: HandlebarsTemplateDelegate
  private emailTemplateAfterMaturity: HandlebarsTemplateDelegate
  private transporter: nodemailer.Transporter

  constructor(
    private readonly orderService: ServiceService,
    private readonly clientService: ClientsService,
    private readonly configurationSystemService: ConfigurationSystemService,
  ) {
    const templateNotificationBoletoPendingPath = path.resolve(
      'dist',
      'mails',
      'templates',
      'emailTemplateNotificationBoletoPending.hbs',
    )
    const templatePath = path.resolve(
      'dist',
      'mails',
      'templates',
      'pendingboleto.hbs',
    )
    const emailTemplateAfterMaturityPath = path.resolve(
      'dist',
      'mails',
      'templates',
      'emailTemplateAfterMaturity.hbs',
    )
    const templateContent = fs.readFileSync(templatePath, 'utf8')
    const templateNotificationBoletoPendingContent = fs.readFileSync(templateNotificationBoletoPendingPath, 'utf8')
    const templateContentAfterMaturityPath = fs.readFileSync(
      emailTemplateAfterMaturityPath,
      'utf8',
    )

    this.emailTemplate = handlebars.compile(templateContent)
    this.emailTemplateNotificationBoletoPendingContent = handlebars.compile(templateNotificationBoletoPendingContent)
    this.emailTemplateAfterMaturity = handlebars.compile(
      templateContentAfterMaturityPath,
    )

    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'solution.financeiro2012@gmail.com',
        pass: process.env.ID_SEND_EMAIL,
      },
    })
    this.transporter.use('compile', base64ToS3({folder: 'temp'}))
  }

  async sendEmail(
    to: string,
    subject: string,
    body: string,
    gifPath: string,
    pdfAttachment: FileType[],
    orderNumber: string,
  ) {
    const mailOptions = {
      from: 'solution.financeiro2012@gmail.com',
      to: to,
      subject: subject,
      html: body,
      attachments: [
        {
          filename: 'gif.gif',
          path: gifPath,
          cid: 'unique@nodemailer.com',
        },
      ],
    }

    if (pdfAttachment.length) {
      pdfAttachment.forEach((attachment) => {
        mailOptions.attachments.push({
          filename: attachment.fileName,
          path: attachment.path,
          cid: attachment.fileName,
        })
      })
    }

    try {
      const info = await this.transporter.sendMail(mailOptions)
      console.log('E-mail enviado:', info.response)
    } catch (error) {
      console.error('Erro ao enviar o e-mail:', error)
    }
  }

  async onSendEmail(
    email: string,
    osId: string,
    days: number,
    clientName: string,
    pdfAttachment: FileType[],
    osNumber: string,
    total: string,
    dueDateDaysAfterMaturity?: string,
  ) {
    const gifPath = path.resolve(
      'dist',
      'mails',
      'templates',
      'solution-email.gif',
    )
    const gifData = fs.readFileSync(gifPath, 'base64')
    const data = {
      maturity: `${
        days === 3
          ? 'vencerá após 3 dias do envio deste email.'
          : 'vencerá hoje.'
      }`,
      gif: `data:image/gif;base64,${gifData}`,
      dueDateDaysAfterMaturity,
      osNumber,
    }
    const html = dueDateDaysAfterMaturity
      ? this.emailTemplateAfterMaturity(data)
      : this.emailTemplate(data)
    setTimeout(async () => {
      this.sendEmail(
        email,
        `Lembrete Importante: ${
          dueDateDaysAfterMaturity ? 'Boleto Vencido' : 'Vencimento do Boleto'
        }`,
        html,
        gifPath,
        pdfAttachment,
        osNumber,
      ) //isSendThreeDayAfterMaturityBoleto
      this.orderService.updateStatusSendEmailSchedule(
        osId,
        !dueDateDaysAfterMaturity ? days === 3 : true,
        !dueDateDaysAfterMaturity ? days < 3 : true,
        !!dueDateDaysAfterMaturity,
      )
      const isCurrentDay = days < 3
      if (!dueDateDaysAfterMaturity) {
        this.logger.debug(
          `Enviando e-mail de cobrança para o cliente: ${clientName} - ${
            isCurrentDay ? 'Vencimento hoje' : 'Vencimento daqui 3 dias'
          }`,
        )
      } else {
        this.logger.debug(
          `Enviando e-mail de cobrança para o cliente: ${clientName} - Boleto Vencido.`,
        )
      }
      const message = `📨 Email de notificação de cobrança enviado 📨 \n*Cliente:* ${clientName} \n*OS Nº:* ${osNumber} \n*Tipo de Vencimento:* ${
        dueDateDaysAfterMaturity
          ? 'Boleto Vencido'
          : isCurrentDay
          ? 'Vencimento hoje'
          : 'Vencimento daqui 3 dias'
      } \n*Valor:* ${total}`
      // await this.configurationSystemService.sendMessageGroup(
      //   '120363169904240571@g.us',
      //   message,
      // )
    }, 5000)
  }

  async sendEmailNotification(osNumber: string, clientId: string, isSendFirstTime: boolean) {
    try {
      const pdfAttachment = await this.findFileByOrderNumber(osNumber)
    if (pdfAttachment) {
      const resultClient = await this.clientService.findOne(clientId)
      if (!!resultClient.email) {
        await this.onSendEmailNotification(
          resultClient.email,
          pdfAttachment,
          osNumber,
          isSendFirstTime,
          clientId
        )
      } 
    }
    } catch (error) {
      this.logger.error('[SISTEMA] - Houve um erro ao tentar buscar os arquivos para o envio de email de notificacao de cobranca.', error)
      return null
    }
  }

  async onSendEmailNotification(
    email: string,
    pdfAttachment: FileType[],
    osNumber: string,
    isSendFirstTime?: boolean,
    clientId?: string
  ) {
    let osNumberToResendNotification: string[] = []
    let messageTitleBody = ''

    osNumberToResendNotification = await this.orderService.getPendingOSNumber(clientId)
    const osPending = osNumberToResendNotification.filter((item) => item !== osNumber)

    const getMessagePendingNotification = () => {
      if (osPending.length > 1) {
        return `${!!osPending?.length ? `\n\nAlém disso, informamos que ainda existem as ordens de serviços de número ${osPending.join(
          ', ',
        )} pendentes para pagamento.` : ''}`
      } else {
        return `${!!osPending?.length ? `\n\nAlém disso, informamos que ainda existem a orden de serviço de número ${osPending.join(
          ', ',
        )} pendente para pagamento.` : ''}`
      }
     }

    const gifPath = path.resolve(
      'dist',
      'mails',
      'templates',
      'solution-email.gif',
    )

    if (isSendFirstTime) {
      messageTitleBody = `Estamos enviando esta notificação via Whatsapp para lembrá-lo de que o boleto referente à ordem de serviço de número ${osNumber} foi gerado.`
    } else {
      messageTitleBody = `Gostaríamos de recordar sobre o boleto vinculado à ordem de serviço de número ${osNumber}, o qual ainda não foi liquidado.`
    }

    const gifData = fs.readFileSync(gifPath, 'base64')
    const data = {
      maturity: ``,
      gif: `data:image/gif;base64,${gifData}`,
      messageTitleBody,
      messageBoletoPendingBody: getMessagePendingNotification(),
    }
    const html = this.emailTemplateNotificationBoletoPendingContent(data)
     
    setTimeout(async () => {
      this.sendEmail(
        email,
        `Lembrete Importante: ${
          'Vencimento do Boleto'
        }`,
        html,
        gifPath,
        pdfAttachment,
        osNumber,
      )
     
     
      const message = `📨 Email de notificação de cobrança enviado`
      this.logger.log(message)  

    }, 5000)
  }

  async findFileByOrderNumber(orderNumber: string): Promise<FileType[] | null> {
    //const folderPath = path.join('dist', 'Modules', 'boletos')
    const userHomeDir = os.homedir()
    const folderPath = path.join(userHomeDir, 'boletos')
    //const fileName = `${orderNumber}.pdf`
    //const filePath = path.join(folderPath, fileName)

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
      const filePaths = matchingFiles.map((fileName) => {
        return {
          path: path.join(folderPath, fileName),
          fileName,
        }
      })
      return filePaths
    } catch (err) {
      this.logger.error('[SISTEMA] - Error accessing the folder or file:', err)
      return null
    }
  }

  async sendOrUpdate(
    osId: string,
    days: number,
    name: string,
    clientId: string,
    osNumber: string,
    total: string,
    dueDateDaysAfterMaturity?: string,
  ) {
    const pdfAttachment = await this.findFileByOrderNumber(osNumber)
    if (pdfAttachment) {
      const resultClient = await this.clientService.findOne(clientId)
      if (!!resultClient.email) {
        await this.onSendEmail(
          resultClient.email,
          osId,
          days,
          name,
          pdfAttachment,
          osNumber,
          total,
          dueDateDaysAfterMaturity,
        )
      } else {
        await this.clientService.updateRegisterNotification(clientId, true)
      }
    } else {
      await this.orderService.updateBoletoUploaded(osNumber, false)
    }
  }

  async getMaturityOfTheBoleto() {
    const timeZone = 'America/Sao_Paulo'
    const today = new Date()
    const now = DateTime.now().setZone(timeZone)
    const currentDay = now.toISO()

    const threeDaysFromNowOrDayCurrentNow = addDays(today, 3)

    const orderService = await this.orderService.findAllWithoutParam()
    for (let index = 0; index < orderService.length; index++) {
      const orderServiceItem = orderService[index]
      const clientId = orderServiceItem?.client?.id
      const osId = orderServiceItem?.id
      const name = orderServiceItem?.client?.name
      const osNumber = orderServiceItem?.osNumber
      const total = orderServiceItem?.total

      const maturityDate = parse(
        orderServiceItem.maturityOfTheBoleto || '',
        'dd/MM/yyyy',
        new Date(),
      )

      const dueDatePlus3DaysMaturity = addDays(maturityDate, 3)

      if (
        String(orderServiceItem.status).trim() === 'PENDENTE' &&
        String(orderServiceItem.formOfPayment).trim() === 'Boleto'
      ) {
        if (
          format(new Date(currentDay), 'yyyy-MM-dd') ===
          format(maturityDate, 'yyyy-MM-dd')
        ) {
          if (!orderServiceItem.isSendNowDayMaturityBoleto) {
            await this.sendOrUpdate(osId, 0, name, clientId, osNumber, total)
          }
        }
        if (
          isWithinInterval(maturityDate, {
            start: today,
            end: threeDaysFromNowOrDayCurrentNow,
          })
        ) {
          if (!orderServiceItem.isSendThreeDayMaturityBoleto) {
            await this.sendOrUpdate(osId, 3, name, clientId, osNumber, total)
          }
        }
        if (isSameDay(today, dueDatePlus3DaysMaturity)) {
          if (!orderServiceItem.isSendThreeDayAfterMaturityBoleto) {
            await this.sendOrUpdate(
              osId,
              3,
              name,
              clientId,
              osNumber,
              total,
              orderServiceItem.maturityOfTheBoleto,
            )
          }
        }
      }
    }
  }

  start() {
    // Agendando uma tarefa para ser executada todos os dias às 8h da manhã
    // cron.schedule('0 8 * * *', () => {
    //   // Lógica da tarefa que será executada
    //   console.log('Tarefa agendada executada!')
    // })

    //  A cada minuto: '*/1 * * * *'

    cron.schedule('*/1 * * * *', async () => {
      if (isDevelopmentEnvironment()) {
        await this.getMaturityOfTheBoleto()
      }
    })
    cron.schedule('0 8 * * *', async () => {
      if (!isDevelopmentEnvironment()) {
        await this.getMaturityOfTheBoleto()
      }
    })
    cron.schedule('0 12 * * *', async () => {
      if (!isDevelopmentEnvironment()) {
        await this.getMaturityOfTheBoleto()
      }
    })
  }
}
