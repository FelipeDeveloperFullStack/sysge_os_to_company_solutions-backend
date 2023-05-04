import { forwardRef, HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { AuthService } from '../auth/auth.service'
import { UsersService } from '../../users/users.service'
import { Token, TokenDocument } from './token.entity'

@Injectable()
export class TokenService {
  constructor(
    @InjectModel(Token.name)
    private tokenModel: Model<TokenDocument>,
    private usersService: UsersService,
    @Inject(forwardRef(() => AuthService))
    private authService: AuthService
  ) {}

  async save(hash: string, userName: string) {
    const hashToSave = new this.tokenModel({ hash, userName })
    const isExistToken = await this.tokenModel.findOne({ userName })
    if (isExistToken?.hash){
      await this.tokenModel.updateOne({ hash: isExistToken?.hash }, { 
        $set: {
          hash
        }
       })
    } else {
      try {
        hashToSave.save()
      } catch (error) {
        // return HttpException(HttpStatus.FORBIDDEN,)
      }
    }
  }  

  async refreshToken(oldToken: string) {
    let objToken = await this.tokenModel.findOne({ hash: oldToken })
    if (objToken) {
      let user = await this.usersService.findOne(objToken.userName)
      return this.authService.login(user)
    } else {
      return new HttpException({
          message: 'Token inválido!'
        }, HttpStatus.UNAUTHORIZED
      )
    }
  }

}
