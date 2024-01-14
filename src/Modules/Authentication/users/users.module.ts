import { forwardRef, Module } from '@nestjs/common'
import { UsersService } from './users.service'
import { UsersController } from './users.controller'
import { MongooseModule } from '@nestjs/mongoose'
import { UserSchema, User } from './Entities/user.entity'
import { MailModule } from 'src/mails/mail.module'
import { MailService } from 'src/mails/mail.service'
import { AuthModule } from '../AuthToken/auth/auth.module'
import { AuthTokenModule } from 'src/Modules/Authentication/AuthToken/auth-token.module'

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MailModule,
    forwardRef(() => AuthModule),
    forwardRef(() => AuthTokenModule),
  ],
  controllers: [UsersController],
  providers: [UsersService, MailService],
  exports: [UsersService]
})
export class UsersModule {}
