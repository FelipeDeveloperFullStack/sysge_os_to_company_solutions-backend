import {Injectable, OnModuleInit, Logger} from '@nestjs/common'
import * as cron from 'node-cron'
import * as nodemailer from 'nodemailer'
import * as handlebars from 'handlebars'
import * as fs from 'fs'
import * as path from 'path'
import * as base64ToS3 from 'nodemailer-base64-to-s3'
import {isDevelopmentEnvironment} from 'src/Common/Functions'

@Injectable()
export class ScheduleBoletoService implements OnModuleInit {
  private logger = new Logger()
  private emailTemplate: HandlebarsTemplateDelegate
  private transporter: nodemailer.Transporter

  constructor() {
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

  onModuleInit() {
    // Agendando uma tarefa para ser executada todos os dias às 8h da manhã
    // cron.schedule('0 8 * * *', () => {
    //   // Lógica da tarefa que será executada
    //   console.log('Tarefa agendada executada!')
    // })
    if (!isDevelopmentEnvironment()) {
      cron.schedule('*/1 * * * *', () => {
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
          'felipeanalista3@gmail.com',
          'Lembrete Importante: Vencimento do Boleto Hoje',
          html,
          gifPath,
        )
        this.logger.debug('Enviando e-mail de cobrança para o cliente.')
      })
    }
  }
}
