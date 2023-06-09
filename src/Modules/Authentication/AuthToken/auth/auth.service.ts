import {Injectable} from '@nestjs/common'
import {UnauthorizedException} from '@nestjs/common/exceptions/unauthorized.exception'
import {JwtService} from '@nestjs/jwt'
import {Encrypt} from 'src/Common/Helpers/encrypt'
import {TokenService} from 'src/Modules/Authentication/AuthToken/Token/token.service'
import {UsersService} from '../../users/users.service'

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private tokenService: TokenService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findOne(email)
    if (user && Encrypt.compareHashSync(password, user?.password)) {
      const {password, ...result} = user
      return result
    }
    return null
  }

  async login(user: any) {
    const userData = await this.usersService.findOne(user?._doc?.email)
    if (userData?.status === 'ATIVO') {
      const payload = {
        cpf: userData?.cpf,
        name: userData?.name,
        username: user?._doc?.email,
        sub: user?._doc?._id,
      }
      const token = this.jwtService.sign(payload)
      await this.tokenService.save(token, user?._doc.email)
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
