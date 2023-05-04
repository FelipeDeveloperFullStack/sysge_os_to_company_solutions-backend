import { MailerModule } from '@nestjs-modules/mailer';
import { Module } from '@nestjs/common'
import { join } from 'path';
import { MailService } from './mail.service';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter'

@Module({
  imports: [
    MailerModule.forRoot({
      transport: {
        service: 'gmail',
        host: process.env.AUTH_SMTP_HOST,
        secure: true,
        logger: true,
        debug: true,
        // ignoreTLS: true,
        // tls: {
        //   rejectUnauthorized: true
        // },
        auth: {
          type: 'OAUTH2',
          user: process.env.AUTH_EMAIL_USER_SENDEMAIL,
          serviceClient: process.env.OAUTH_CLIENT_ID,
          privateKey: process.env.OAUTH_CLIENT_SECRET,
          //pass: process.env.AUTH_APP_PASSWORD_GOOGLE_EMAIL
        },
        port: Number(process.env.AUTH_PORT_SMTP_SENDEMAIL),
      },
      defaults: {
        from: '"Não responder" <noreply@gmail.com>',
      },
      template: {
        dir: join(__dirname, 'templates'),
        adapter: new HandlebarsAdapter(),
        options: {
          strict: true,
        },
      }
    })
  ],
  providers: [MailService],
})
export class MailModule {}
