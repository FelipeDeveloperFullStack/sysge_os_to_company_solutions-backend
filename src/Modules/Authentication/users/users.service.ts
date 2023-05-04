import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Encrypt } from 'src/Common/Helpers/encrypt'
import { MailService } from 'src/mails/mail.service'
import { CreateUserDto } from './Dto/create-user.dto'
import { User, UserDocument } from './Entities/user.entity'
import { IUserServiceCreate } from './Types'

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    private mailService: MailService,
  ) {}

  private async encryptPassword(
    createUserDto: CreateUserDto,
    tokenRandom: string,
  ) {
    createUserDto = {
      ...createUserDto,
      name: createUserDto.name,
      password: Encrypt.hashSync(createUserDto.password),
      token: String(
        await Encrypt.encrypt(tokenRandom + createUserDto.cpf),
      ).replace(/[^a-zA-Z0-9 ]/g, ''),
    }
    return createUserDto
  }

  async create(
    createUserDto: CreateUserDto,
  ): Promise<User | IUserServiceCreate> {
    const token = Math.floor(Math.random() * 99999).toString()
    createUserDto = await this.encryptPassword(createUserDto, token)

    const createUser = new this.userModel(createUserDto)

    const isExistCPF = await this.userModel.find({ cpf: createUserDto.cpf })

    const isExistEmail = await this.userModel.find({
      email: createUserDto.email?.trim(),
    })

    if (isExistCPF?.length || isExistEmail?.length) {
      throw new HttpException(
        {
          message: 'Esse usuário já está cadastrado',
        },
        HttpStatus.UNAUTHORIZED,
      )
    } else {
      try {
        // await this.mailService.sendUserConfirmation(createUserDto)
        const userCreated = createUser.save()
        return userCreated
      } catch (error) {
        console.error(error)
        throw new HttpException(
          {
            message: error,
          },
          HttpStatus.FORBIDDEN,
        )
      }
    }
  }

  async findAll() {
    const result = await this.userModel.find().exec()
    return result
  }

  async findOne(email: string): Promise<User | undefined> {
    const result = await this.userModel.findOne({ email })
    return result
  }

  async findByToken(token: string) {
    return await this.userModel.findOne({ token })
  }

  async updateTokenUser(token: string) {
    try {
      await this.userModel.updateOne(
        { token },
        {
          $set: {
            isTokenValidated: true,
          },
        },
      )
    } catch (error) {
      return error
    }
  }

  remove(id: number) {
    return `This action removes a #${id} user`
  }
}
