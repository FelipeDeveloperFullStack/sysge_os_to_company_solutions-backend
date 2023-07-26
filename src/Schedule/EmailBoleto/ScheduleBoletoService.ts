import {Injectable, Logger} from '@nestjs/common'
import * as cron from 'node-cron'
import * as nodemailer from 'nodemailer'
import * as handlebars from 'handlebars'
import * as fs from 'fs'
import * as path from 'path'
import * as base64ToS3 from 'nodemailer-base64-to-s3'
import {isDevelopmentEnvironment} from 'src/Common/Functions'
import {ServiceService} from 'src/Modules/OrderService/services.service'
import {addDays, isWithinInterval, parse, isEqual, format} from 'date-fns'
import {DateTime} from 'luxon'
import {ClientsService} from 'src/Modules/Clients/clients.service'

type FileType = {
  path: string
  fileName: string
}

@Injectable()
export class ScheduleBoletoService {
  private logger = new Logger()
  private emailTemplate: HandlebarsTemplateDelegate
  private transporter: nodemailer.Transporter

  constructor(
    private readonly orderService: ServiceService,
    private readonly clientService: ClientsService,
  ) {
    const templatePath = path.resolve(
      'dist',
      'mails',
      'templates',
      'pendingboleto.hbs',
    )
    const templateContent = fs.readFileSync(templatePath, 'utf8')
    this.emailTemplate = handlebars.compile(templateContent)
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
    }
    const html = this.emailTemplate(data)
    setTimeout(() => {
      this.sendEmail(
        email,
        'Lembrete Importante: Vencimento do Boleto',
        html,
        gifPath,
        pdfAttachment,
        osNumber,
      )
      this.orderService.updateStatusSendEmailSchedule(
        osId,
        days === 3,
        days < 3,
      )
      const isCurrentDay = days < 3
      this.logger.debug(
        `Enviando e-mail de cobrança para o cliente: ${clientName} - ${
          isCurrentDay ? 'Vencimento hoje' : 'Vencimento daqui 3 dias'
        }`,
      )
    }, 5000)
  }

  async findFileByOrderNumber(orderNumber: string): Promise<FileType[] | null> {
    const folderPath = path.join('dist', 'Modules', 'boletos')
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

      const maturityDate = parse(
        orderServiceItem.maturityOfTheBoleto || '',
        'dd/MM/yyyy',
        new Date(),
      )
      if (
        String(orderServiceItem.status).trim() === 'PENDENTE' &&
        String(orderServiceItem.formOfPayment).trim() === 'Boleto'
      ) {
        if (
          format(new Date(currentDay), 'yyyy-MM-dd') ===
          format(maturityDate, 'yyyy-MM-dd')
        ) {
          if (!orderServiceItem.isSendNowDayMaturityBoleto) {
            await this.sendOrUpdate(osId, 0, name, clientId, osNumber)
          }
        }
        if (
          isWithinInterval(maturityDate, {
            start: today,
            end: threeDaysFromNowOrDayCurrentNow,
          })
        ) {
          if (!orderServiceItem.isSendThreeDayMaturityBoleto) {
            await this.sendOrUpdate(osId, 3, name, clientId, osNumber)
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
  }
}
