import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { UserSchema } from 'src/Modules/Authentication/users/Entities/user.entity'

@Module({
  imports: [MongooseModule.forFeature([
    { name: 'User', schema: UserSchema },
  ])],
})
export class MongodbModule {}
