import {HttpException, HttpStatus, Injectable} from '@nestjs/common'
import {InjectModel} from '@nestjs/mongoose'
import {Model} from 'mongoose'
import {ClientDto} from './dto/client.dto'
import {ClientFilterDto} from './dto/client.filter.dto'
import {Client, ClientDocument} from './entities/client.entity'

@Injectable()
export class ClientsService {
  constructor(
    @InjectModel(Client.name)
    private clientModel: Model<ClientDocument>,
  ) {}

  async create(createClientDto: ClientDto) {
    createClientDto = {
      ...createClientDto,
      name: String(createClientDto.name.trim()).toUpperCase(),
    }
    const client = new this.clientModel(createClientDto)

    const isExistCPFOrCNPJ = await this.clientModel.find({
      cpfOrCnpj: createClientDto.cpfOrCnpj,
    })
    if (isExistCPFOrCNPJ.length) {
      throw new HttpException(
        {
          message: 'Já existe um cliente cadastrado com esse CNPJ ou CPF',
        },
        HttpStatus.UNAUTHORIZED,
      )
    } else {
      try {
        client.save()
        return {
          status: HttpStatus.CREATED,
        }
      } catch (error) {
        throw new HttpException(
          {
            message: error,
          },
          HttpStatus.FORBIDDEN,
        )
      }
    }
  }

  async getTotalIncomes() {
    const result = await this.clientModel.find()
    return {total: result?.length}
  }

  async findAll(clientFilter: ClientFilterDto) {
    const client = {
      name: new RegExp(clientFilter.name, 'i'),
      // address: new RegExp(clientFilter.address, 'i'),
      // city: new RegExp(clientFilter.city, 'i'),
      // uf: new RegExp(clientFilter.uf, 'i'),
      // email: new RegExp(clientFilter.email, 'i'),
      // phoneNumber: new RegExp(clientFilter.phoneNumber, 'i'),
      // phoneNumberFixo: new RegExp(clientFilter.phoneNumberFixo, 'i'),
      // cep: new RegExp(clientFilter.cep, 'i'),
      cpfOrCnpj: new RegExp(clientFilter.cpfOrCnpj, 'i'),
    }
    return await this.clientModel.find(client)
  }

  async findOne(id: string) {
    return await this.clientModel.findOne({_id: id})
  }

  async update(id: string, updateClientDto: ClientDto) {
    try {
      await this.clientModel.updateOne(
        {
          _id: id,
        },
        {
          $set: {
            name: String(updateClientDto.name).toUpperCase(),
            address: updateClientDto.address,
            city: updateClientDto.city,
            uf: updateClientDto.uf,
            email: updateClientDto.email,
            phoneNumber: updateClientDto.phoneNumber,
            phoneNumberFixo: updateClientDto.phoneNumberFixo,
            cep: updateClientDto.cep,
            cpfOrCnpj: updateClientDto.cpfOrCnpj,
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

  async remove(id: string) {
    try {
      await this.clientModel.deleteOne({_id: id})
      return {
        status: HttpStatus.CREATED,
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
