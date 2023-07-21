import {Injectable, Logger} from '@nestjs/common'
import * as cron from 'node-cron'
import * as nodemailer from 'nodemailer'
import * as handlebars from 'handlebars'
import * as fs from 'fs'
import * as path from 'path'
import * as base64ToS3 from 'nodemailer-base64-to-s3'
import {isDevelopmentEnvironment} from 'src/Common/Functions'
import {ServiceService} from 'src/Modules/OrderService/services.service'
import {addDays, isWithinInterval, parse, isEqual} from 'date-fns'
import {DateTime} from 'luxon'
import {ClientsService} from 'src/Modules/Clients/clients.service'

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
        pass: 'forsudxauoyxqomx',
      },
    })
    this.transporter.use('compile', base64ToS3({folder: 'temp'}))
  }

  async sendEmail(to: string, subject: string, body: string, gifPath: string) {
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
    clientName?: string,
  ) {
    const gifPath = path.resolve(
      'dist',
      'mails',
      'templates',
      'solution-email.gif',
    )
    const gifData = fs.readFileSync(gifPath, 'base64')
    const data = {
      title: '',
      gif: `data:image/gif;base64,${gifData}`,
    }
    const html = this.emailTemplate(data)
    this.sendEmail(
      email,
      // 'Lembrete Importante: Vencimento do Boleto',
      `Lembrete Importante: ${clientName}`,
      html,
      gifPath,
    )
    this.orderService.updateStatusSendEmailSchedule(osId, days === 3, days < 3)
    const isCurrentDay = days < 3
    this.logger.debug(
      `Enviando e-mail de cobrança para o cliente: ${clientName} - ${
        isCurrentDay ? 'Vencimento hoje' : 'Vencimento daqui 3 dias'
      }`,
    )
  }

  async sendOrUpdate(
    osId: string,
    days: number,
    name: string,
    clientId: string,
  ) {
    const resultClient = await this.clientService.findOne(clientId)
    if (!!resultClient.email) {
      await this.onSendEmail(resultClient.email, osId, days, name)
    } else {
      await this.clientService.updateRegisterNotification(clientId, true)
    }
  }

  async getMaturityOfTheBoleto(days: number) {
    const timeZone = 'America/Sao_Paulo'
    const today = new Date()
    const now = DateTime.now().setZone(timeZone)
    const currentDay = now.toISO()

    const threeDaysFromNowOrDayCurrentNow = addDays(today, days)
    const orderService = await this.orderService.findAllWithoutParam()
    for (let index = 0; index < orderService.length; index++) {
      const orderServiceItem = orderService[index]
      const clientId = orderServiceItem?.client?.id
      const osId = orderServiceItem?.id
      const name = orderServiceItem?.client?.name

      const maturityDate = parse(
        orderServiceItem.maturityOfTheBoleto || '',
        'dd/MM/yyyy',
        new Date(),
      )
      if (
        orderServiceItem.status === 'PENDENTE' &&
        orderServiceItem.formOfPayment === 'Boleto'
      ) {
        console.log({currentDay, threeDaysFromNowOrDayCurrentNow})
        if (isEqual(new Date(currentDay), threeDaysFromNowOrDayCurrentNow)) {
          await this.sendOrUpdate(osId, days, name, clientId)
        }
        if (
          isWithinInterval(maturityDate, {
            start: today,
            end: threeDaysFromNowOrDayCurrentNow,
          })
        ) {
          await this.sendOrUpdate(osId, days, name, clientId)
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
    const today = new Date()
    const threeDaysFromNowOrDayCurrentNow = addDays(today, 0)
    cron.schedule('*/1 * * * *', async () => {
      if (isDevelopmentEnvironment()) {
        // await this.getMaturityOfTheBoleto(3)
        //await this.getMaturityOfTheBoleto(-1)
      }
    })
  }
}
