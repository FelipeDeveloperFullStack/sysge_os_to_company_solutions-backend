import { Injectable } from '@nestjs/common'
import { MailerService } from '@nestjs-modules/mailer'
import { CreateUserDto } from 'src/Modules/Authentication/users/Dto/create-user.dto'

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService){}

  async sendUserConfirmation(user: CreateUserDto) {
    const url = `${process.env.ENDPOINT_BACKEND}/auth/confirm?token=${user.token}`
    await this.mailerService.sendMail({
      to: 'felipeanalista3@gmail.com',
      subject: 'Bem-vindo! Confirme seu email.',
      template: 'confirmation',
      context: {
        name: user.name,
        url,
      }
    })
  }
}
