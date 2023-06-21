import {HttpException, HttpStatus, Injectable} from '@nestjs/common'
import {InjectModel} from '@nestjs/mongoose'
import {Model} from 'mongoose'
import {isDevelopmentEnvironment} from 'src/Common/Functions'
import {
  createFolder,
  listFolder,
  destroy,
} from '../OrderService/googleDrive/gdrive'
import {ClientDto} from './dto/client.dto'
import {ClientFilterDto} from './dto/client.filter.dto'
import {Client, ClientDocument} from './entities/client.entity'

type IdFolderToDocument = {
  idFolderToDocument: string
  idFolderClientName: string
}

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

    const isExistName = await this.clientModel.find({
      name: String(createClientDto.name.trim()).toUpperCase(),
    })
    if (isExistName.length) {
      throw new HttpException(
        {
          message: `Já existe um cliente cadastrado com o nome ${String(
            createClientDto.name.trim(),
          ).toUpperCase()}`,
        },
        HttpStatus.UNAUTHORIZED,
      )
    } else {
      try {
        const result = await client.save()
        await this.createDirectoryClientGoogleDrive(client, result?._id)
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

  async update(id: string, client: ClientDto) {
    if (
      !client.idFolderClientName ||
      !client.idFolderOrcamento ||
      !client.idFolderOsPagas ||
      !client.idFolderOsPendentes ||
      !client.idFolderOsUnificadas
    ) {
      throw new HttpException(
        {
          message: 'IDs da Pasta no Google Drive Obrigatórias.',
        },
        HttpStatus.EXPECTATION_FAILED,
      )
    }

    try {
      await this.clientModel.updateOne(
        {
          _id: id,
        },
        {
          $set: {
            name: String(client.name).toUpperCase(),
            address: client.address,
            city: client.city,
            uf: client.uf,
            email: client.email,
            phoneNumber: client.phoneNumber,
            phoneNumberFixo: client.phoneNumberFixo,
            cep: client.cep,
            cpfOrCnpj: client.cpfOrCnpj,
            idFolderOsPagas: client.idFolderOsPagas,
            idFolderOsPendentes: client.idFolderOsPendentes,
            idFolderOsUnificadas: client.idFolderOsUnificadas,
            idFolderOrcamento: client.idFolderOrcamento,
            idFolderClientName: client.idFolderClientName,
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
  async updateIdsFolderGoogleDrive(
    id: string,
    idFolderOsPagas: string,
    idFolderOsPendentes: string,
    idFolderOsUnificadas: string,
    idFolderOrcamento: string,
    idFolderClientName: string,
  ) {
    try {
      await this.clientModel.updateOne(
        {
          _id: id,
        },
        {
          $set: {
            idFolderOsPagas: idFolderOsPagas,
            idFolderOsPendentes: idFolderOsPendentes,
            idFolderOsUnificadas: idFolderOsUnificadas,
            idFolderOrcamento: idFolderOrcamento,
            idFolderClientName: idFolderClientName,
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

  async remove(id: string, idFolderClientName: string) {
    try {
      console.log(`[Sistema] - Excluindo os dados do cliente ${id}...`)
      await this.clientModel.deleteOne({_id: id})
      console.log(`[Sistema] - Excluindo a pasta do cliente no Google Drive`)
      await destroy({fileId: idFolderClientName})
      console.log(`[Sistema] - Procedimento finalizado.`)
      console.log(`✅-----------------------------------✅`)
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

  async createFolder(idFolderClientName: string, folderToDocumentName: string) {
    try {
      const result = await listFolder({
        parents: idFolderClientName,
      })
      const resultFolders = result.files.filter(
        (folder) => folder.name === folderToDocumentName,
      )
      /** Se a pasta não existir */
      if (!resultFolders.length) {
        /** Cria a pasta */
        const {data} = await createFolder({
          folderName: folderToDocumentName,
          parents: idFolderClientName,
        })
        const idFolderToDocument = data?.id
        return {
          idFolderToDocument,
          idFolderClientName,
        }
      } else {
        const {id} = resultFolders[0]
        const idFolderToDocument = id
        return {
          idFolderToDocument,
          idFolderClientName,
        }
      }
    } catch (error) {
      console.log(error)
      throw new HttpException(
        {
          message: error,
        },
        HttpStatus.EXPECTATION_FAILED,
      )
    }
  }

  async createFoldersToDocuments(
    idFolderClientName: string,
    idClientCreated: string,
  ) {
    console.log(`[Sistema] - Criando a pasta O.S PAGAS.`)
    const resultOSPagas = await this.createFolder(
      idFolderClientName,
      'O.S PAGAS',
    )
    console.log(`[Sistema] - Criando a pasta O.S PENDENTES`)
    const resultOsPendentes = await this.createFolder(
      idFolderClientName,
      'O.S PENDENTES',
    )
    console.log(`[Sistema] - Criando a pasta O.S UNIFICADAS.`)
    const resultOsUnificadas = await this.createFolder(
      idFolderClientName,
      'O.S UNIFICADAS',
    )
    console.log(`[Sistema] - Criando a pasta ORÇAMENTOS.`)
    const resultOrcamentos = await this.createFolder(
      idFolderClientName,
      'ORÇAMENTOS',
    )

    await this.updateIdsFolderGoogleDrive(
      idClientCreated,
      resultOSPagas.idFolderToDocument,
      resultOsPendentes.idFolderToDocument,
      resultOsUnificadas.idFolderToDocument,
      resultOrcamentos.idFolderToDocument,
      idFolderClientName,
    )
    console.log(`[Sistema] - Procedimento finalizado.`)
    console.log(`✅-----------------------------------✅`)
  }

  async createFolderWithClientName(
    idClientsFolder: string,
    clientName: string,
    idClientCreated: string,
  ) {
    /** Lista todas as pastas dentro da pasta CLIENTES */
    const result = await listFolder({
      parents: idClientsFolder,
    })
    const resultFolderClients = result.files.filter(
      (folder) => folder.name === clientName,
    )
    /** Se a pasta do cliente não existir */
    if (!resultFolderClients.length) {
      /** Cria a pasta com o nome do cliente */
      console.log(
        `[Sistema] - Criando a pasta com o nome do cliente: ${clientName}`,
      )
      const {data} = await createFolder({
        folderName: clientName,
        parents: idClientsFolder,
      })
      const idFolderWithNameClient = data?.id
      /** Cria as pasta para salvar os documentos */
      await this.createFoldersToDocuments(
        idFolderWithNameClient,
        idClientCreated,
      )
    } else {
      /** Quando a pasta do cliente já existir */
      /** Cria as pasta para salvar os documentos */
      const idFolderWithNameClient = resultFolderClients[0]?.id
      await this.createFoldersToDocuments(
        idFolderWithNameClient,
        idClientCreated,
      )
    }
  }

  async createDirectoryClientGoogleDrive(
    client: ClientDto,
    idClientCreated: string,
  ) {
    const ID_FOLDER_MAIN = isDevelopmentEnvironment()
      ? process.env.ID_FOLDER_MAIN_GOOGLE_DRIVE_DEVELOPMENT
      : process.env.ID_FOLDER_MAIN_GOOGLE_DRIVE
    try {
      console.log('[Sistema] - Verificando se a pasta CLIENTES já existe...')
      const listResult = await listFolder({
        parents: ID_FOLDER_MAIN,
      })
      /** Se não existir a pasta CLIENTES */
      if (!listResult.files.length) {
        console.log('[Sistema] - Criando a pasta CLIENTES...')
        const {data} = await createFolder({
          folderName: 'CLIENTES',
          parents: ID_FOLDER_MAIN,
        })
        /** Cria a pasta com o nome do cliente */
        await this.createFolderWithClientName(
          data?.id,
          client.name,
          idClientCreated,
        )
      } else {
        /** Quando existir a pasta CLIENTES */
        const resultFilterFoldersName = listResult.files.filter(
          (folder) => folder.name === 'CLIENTES',
        )
        if (resultFilterFoldersName.length) {
          const {id} = resultFilterFoldersName[0]
          /** Cria a pasta com o nome do cliente */
          await this.createFolderWithClientName(
            id,
            client.name,
            idClientCreated,
          )
        }
      }
    } catch (error) {
      console.log(error)
      throw new HttpException(
        {
          message: error,
        },
        HttpStatus.EXPECTATION_FAILED,
      )
    }
  }
}
