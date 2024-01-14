import {HttpException, HttpStatus, Injectable} from '@nestjs/common'
import {InjectModel} from '@nestjs/mongoose'
import {Model} from 'mongoose'
import {Encrypt} from 'src/Common/Helpers/encrypt'
import {MailService} from 'src/mails/mail.service'
import {CreateUserDto} from './Dto/create-user.dto'
import {UpdateUserDto} from './Dto/update-user.dto'
import {UserFilterDto} from './Dto/user.filter.dto'
import {User, UserDocument} from './Entities/user.entity'
import {IUserServiceCreate} from './Types'

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
    user: string,
  ): Promise<User | IUserServiceCreate> {
    // const token = Math.floor(Math.random() * 99999).toString()
    //createUserDto = await this.encryptPassword(createUserDto, token)

    const dataUser = {
      ...createUserDto,
      user,
      name: String(createUserDto.name).toUpperCase(),
    }

    const createUser = new this.userModel(dataUser)

    const isExistCPF = await this.userModel.find({cpf: createUserDto.cpf})

    // const isExistEmail = await this.userModel.find({
    //   email: createUserDto.email?.trim(),
    // })

    if (isExistCPF?.length) {
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

  async findAll(serviceParam: UserFilterDto) {
    const users = {
      name: new RegExp(serviceParam.name, 'i'),
    }
    return await this.userModel.find(users)
    // const result = await this.userModel.find().exec()
    //return result
  }

  async findOne(cpf: string): Promise<User | undefined> {
    const result = await this.userModel.findOne({cpf})
    return result
  }

  async findByToken(token: string) {
    return await this.userModel.findOne({token})
  }

  async updateTokenUser(token: string) {
    try {
      await this.userModel.updateOne(
        {token},
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

  async update(id: string, userDto: CreateUserDto, user: string) {
    try {
      //const token = Math.floor(Math.random() * 99999).toString()
      // userDto = await this.encryptPassword(userDto, token)
      await this.userModel.updateOne(
        {
          _id: id,
        },
        {
          $set: {
            name: String(userDto.name).toUpperCase(),
            email: userDto.email,
            cpf: userDto.cpf,
            typeUser: String(userDto.typeUser).toUpperCase(),
            password: userDto.password,
            permissions: userDto.permissions,
            user,
          },
        },
      )
      return {
        status: HttpStatus.OK,
      }
    } catch (error) {
      throw new HttpException(
        {
          message: error,
        },
        HttpStatus.EXPECTATION_FAILED,
      )
    }
  }
  async updateStatus(id: string, userDto: UpdateUserDto, user: string) {
    try {
      await this.userModel.updateOne(
        {
          _id: id,
        },
        {
          $set: {
            user,
            status: String(userDto.status).toUpperCase(),
          },
        },
      )
      return {
        status: HttpStatus.OK,
      }
    } catch (error) {
      throw new HttpException(
        {
          message: error,
        },
        HttpStatus.EXPECTATION_FAILED,
      )
    }
  }

  async remove(id: number) {
    try {
      await this.userModel.deleteOne({_id: id})
      return {
        status: HttpStatus.OK,
      }
    } catch (error) {
      throw new HttpException(
        {
          message: error,
        },
        HttpStatus.EXPECTATION_FAILED,
      )
    }
  }
}
