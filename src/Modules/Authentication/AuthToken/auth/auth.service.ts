import {Injectable, Logger} from '@nestjs/common'
import {UnauthorizedException} from '@nestjs/common/exceptions/unauthorized.exception'
import {JwtService} from '@nestjs/jwt'
// import {Encrypt} from 'src/Common/Helpers/encrypt'
import {TokenService} from 'src/Modules/Authentication/AuthToken/Token/token.service'
import {UsersService} from '../../users/users.service'
import * as fs from 'fs'

@Injectable()
export class AuthService {
  private logger = new Logger()

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private tokenService: TokenService,
  ) {}

  async validateUser(cpf: string, password: string): Promise<any> {
    const user = await this.usersService.findOne(cpf)
    // if (user && Encrypt.compareHashSync(password, user?.password)) {
    //   const {password, ...result} = user
    //   return result
    // }
    // return null
    return user
  }

  async readIPFromFile() {
    try {
      const data = fs.readFileSync('ip.json', 'utf-8')
      const ipData = JSON.parse(data)
      return ipData?.ip
    } catch (error) {
      this.logger.error(error)
    }
  }

  async login(user: any) {
    let ip = undefined
    if (fs.existsSync('ip.json')) {
      ip = await this.readIPFromFile()
    }
    const userData = await this.usersService.findOne(user?._doc?.cpf)
    if (userData?.status === 'ATIVO') {
      const payload = {
        cpf: userData?.cpf,
        name: userData?.name,
        username: user?._doc?.email,
        sub: user?._doc?._id,
        permission: userData?.permissions,
        typeUser: userData?.typeUser,
        ip,
      }
      const token = this.jwtService.sign(payload)
      await this.tokenService.save(token, user?._doc?.cpf)
      return {
        access_token: token,
      }
    } else if (userData?.status === 'BLOQUEADO') {
      throw new UnauthorizedException('Acesso bloqueado!')
    } else {
      throw new UnauthorizedException(
        'Não foi possível autenticar o usuário. Entre em contato com o suporte técnico.',
      )
    }
  }
}
