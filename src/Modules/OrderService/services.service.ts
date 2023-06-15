import {HttpException, HttpStatus, Injectable} from '@nestjs/common'
import {InjectModel} from '@nestjs/mongoose'
import {Model} from 'mongoose'
import {ServiceDto} from './dto/service.dto'
import {ServiceFilterDto} from './dto/service.filter.dto'
import {OrderService, ServiceDocument} from './entities/service.entity'
import * as fs from 'fs'
import * as path from 'path'
import {formatInputPrice} from 'src/Common/Helpers/formatPrice'
import {
  createFolder,
  listFolder,
  about,
  list,
  uploadFile,
  destroy,
} from './googleDrive/gdrive'

@Injectable()
export class ServiceService {
  constructor(
    @InjectModel(OrderService.name)
    private serviceModel: Model<ServiceDocument>,
  ) {}

  async create(createServiceDto: ServiceDto) {
    const service = new this.serviceModel(createServiceDto)

    try {
      service.save()
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

  async findAll(serviceFilter: ServiceFilterDto) {
    const service = {
      description: new RegExp(serviceFilter.clientName, 'i'),
      // status: 'PENDENTE',
      //laudoService: new RegExp(serviceFilter.laudoService, 'i'),
    }
    return await this.serviceModel.find(service)
  }

  async getTotalOrderService() {
    const result = await this.serviceModel.find()
    return {total: result?.length}
  }

  async getSumTotalIncomes() {
    const result = await this.serviceModel.find()
    const total = result.reduce((acc, item) => {
      const {clean} = formatInputPrice(item?.total)
      if (item.status === 'PAGO') {
        return acc + clean
      } else {
        return acc
      }
    }, 0)
    return {total: total}
  }

  async getSumTotalOrcamento() {
    const result = await this.serviceModel.find()
    const total = result.reduce((acc, item) => {
      const {clean} = formatInputPrice(item?.total)
      if (item.typeDocument === 'ORCAMENTO') {
        return acc + clean
      } else {
        return acc
      }
    }, 0)
    return {total: total}
  }

  async findOne(id: string) {
    return await this.serviceModel.findOne({_id: id})
  }

  async update(id: string, updateServiceDto: ServiceDto) {
    try {
      await this.serviceModel.updateOne(
        {
          _id: id,
        },
        {
          $set: updateServiceDto,
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
      await this.serviceModel.deleteOne({_id: id})
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

  async deleteFileByStatusFolder(
    folderName: string,
    idFolderClientName: string,
    filename: string,
  ) {
    try {
      const result = await listFolder({
        parents: idFolderClientName,
      })
      const resultFoldersName = result.files.filter(
        (folder) => folder.name === folderName,
      )
      if (resultFoldersName.length) {
        const {id} = resultFoldersName[0]
        /** Lista todos os arquivos dentro da pasta */
        const resultList = await list({parents: id})
        resultList.files.forEach(async (file) => {
          if (file.name === `${filename}.pdf`) {
            console.log(
              `[Sistema] - Arquivo ${file.name} excluido com sucesso dentro da pasta ${folderName}`,
            )
            /** Delete o arquivo */
            await destroy({fileId: file.id})
          }
        })
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

  async uploadFile(idFolder: string, fileName: string, status: string) {
    try {
      const result = await list({parents: idFolder})
      const filePath = path.join(__dirname, '..', 'pdfs', fileName)

      const resultFilderFileName = result.files.filter(
        (file) => file.name === `${fileName}.pdf`,
      )
      if (!resultFilderFileName.length) {
        /** Quando não encontrar o arquivo */
        /** Fazer o upload do arquivo */
        console.log(
          `[Sistema] - Fazendo o upload do arquivo ${fileName} no Google drive...`,
        )
        await uploadFile({
          fileName: `${fileName}.pdf`,
          filePath: `${filePath}.pdf`,
          parents: idFolder,
        })
        await this.deleteFile(fileName)
      } else {
        /** Quando encontrar o arquivo */
        /** Excluir o arquivo e fazer o upload do novo arquivo */
        const {id} = resultFilderFileName[0]
        await destroy({fileId: id})
        console.log(
          `[Sistema] - Fazendo o upload do arquivo ${fileName} no Google drive...`,
        )
        await uploadFile({
          fileName: `${fileName}.pdf`,
          filePath: `${filePath}.pdf`,
          parents: idFolder,
        })
        await this.deleteFile(fileName)
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

  async createFolder(
    idFolder: string,
    folderName: string,
    filename: string,
    status: string,
  ) {
    try {
      const result = await listFolder({
        parents: idFolder,
      })
      const resultFolderOSPagas = result.files.filter(
        (folder) => folder.name === folderName,
      )
      /** Se a pasta não existir */
      if (!resultFolderOSPagas.length) {
        /** Cria a pasta */
        const {data} = await createFolder({
          folderName,
          parents: idFolder,
        })
        const id = data?.id
        /** Faz upload do arquivo dentro da pasta */
        await this.uploadFile(id, filename, status)
      } else {
        const {id} = resultFolderOSPagas[0]
        /** Faz upload do arquivo dentro da pasta */
        await this.uploadFile(id, filename, status)
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
    status: string,
    typeDocument: string,
    idFolder: string,
    filename: string,
  ) {
    if (typeDocument === 'ORCAMENTO') {
      /** Cria a pasta ORCAMENTOS */
      console.log(`[Sistema] - Verificando se pasta ORÇAMENTOS já existe...`)
      await this.createFolder(idFolder, 'ORÇAMENTOS', filename, status)
    } else {
      if (status === 'PAGO') {
        /** Cria a pasta O.S PAGAS */
        console.log(`[Sistema] - Verificando se pasta O.S PAGAS já existe...`)
        await this.createFolder(idFolder, 'O.S PAGAS', filename, status)
        /** Deleta o arquivo dentro da pasta O.S PENDENTES para evitar ficar em duas pastas ao mesmo tempo*/
        await this.deleteFileByStatusFolder('O.S PENDENTES', idFolder, filename)
      }
      if (status === 'PENDENTE') {
        /** Cria a pasta O.S PENDENTES */
        console.log(
          `[Sistema] - Verificando se pasta O.S PENDENTES já existe...`,
        )
        await this.createFolder(idFolder, 'O.S PENDENTES', filename, status)
        /** Deleta o arquivo dentro da pasta O.S PENDENTES para evitar ficar em duas pastas ao mesmo tempo*/
        await this.deleteFileByStatusFolder('O.S PAGAS', idFolder, filename)
      }
    }
  }

  async createFolderWithClientName(
    id: string,
    clientName: string,
    status: string,
    typeDocument: string,
    filename: string,
  ) {
    // typeDocument = ORCAMENTO OU ORDEM_DE_SERVICO
    // status = PENDENTE OU PAGO

    /** Lista todas as pastas dentro da pasta CLIENTES */
    const result = await listFolder({
      parents: id,
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
        parents: id,
      })
      const idFolderWithNameClient = data?.id
      /** Cria as pasta para salvar o documento de acordo com o status */
      await this.createFoldersToDocuments(
        status,
        typeDocument,
        idFolderWithNameClient,
        filename,
      )
    } else {
      /** Quando a pasta do cliente já existir */
      /** Cria as pasta para salvar o documento de acordo com o status */
      await this.createFoldersToDocuments(
        status,
        typeDocument,
        resultFolderClients[0]?.id,
        filename,
      )
    }
  }

  async saveFileInFolderGoogleDrive(
    clientName: string,
    status: string,
    typeDocument: string,
    filename: string,
  ) {
    const ID_FOLDER_MAIN = process.env.ID_FOLDER_MAIN_GOOGLE_DRIVE
    console.log({ID_FOLDER_MAIN})
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
          clientName,
          status,
          typeDocument,
          filename,
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
            clientName,
            status,
            typeDocument,
            filename,
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

  async deleteFile(fileName: string) {
    const folderPath = path.join(__dirname, '..', 'pdfs')

    const filePath = path.join(folderPath, `${fileName}.pdf`)

    fs.unlink(filePath, (error) => {
      if (error) {
        console.error('Erro ao excluir o arquivo:', error)
        return
      }
    })
  }

  async savePDF(
    base64: string,
    filename: string,
    clientName: string,
    status: string,
    typeDocument: string,
  ): Promise<void> {
    try {
      const folderPath = path.join(__dirname, '..', 'pdfs')
      // Cria o diretório "pdfs" caso ele não exista
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath)
      }
      const filePath = path.join(__dirname, '..', 'pdfs', filename)
      const pdfData = base64.split(';base64,').pop()

      /**
       * @description Converte o base64 em arquivo .pdf
       */
      console.log('[Sistema] - Salvando o arquivo .pdf no servidor...')
      new Promise<void>((resolve, reject) => {
        fs.writeFile(
          filePath.concat('.pdf'),
          pdfData,
          {encoding: 'base64'},
          (err) => {
            if (err) {
              reject(err)
            } else {
              resolve()
            }
          },
        )
      })
      setTimeout(async () => {
        console.log(
          '[Sistema] - Iniciando o processo de upload no Google Drive...',
        )
        await this.saveFileInFolderGoogleDrive(
          clientName,
          status,
          typeDocument,
          filename,
        )
        console.log(`[Sistema] - Procedimento finalizado com sucesso.`)
      }, 30000)
    } catch (error) {
      console.log(`[Sistema] - Houve um erro: ${error}`)
      throw new HttpException(
        {
          message: error,
        },
        HttpStatus.EXPECTATION_FAILED,
      )
    }
  }
}
