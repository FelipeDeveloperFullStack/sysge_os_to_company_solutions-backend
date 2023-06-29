import {HttpException, HttpStatus, Injectable, Logger} from '@nestjs/common'
import {InjectModel} from '@nestjs/mongoose'
import {Model} from 'mongoose'
import {ServiceDto} from './dto/service.dto'
import {ServiceFilterDto} from './dto/service.filter.dto'
import {OrderService, ServiceDocument} from './entities/service.entity'
import * as fs from 'fs'
import * as path from 'path'
import {addDays, format, isBefore, isWithinInterval, parse} from 'date-fns'
import {formatInputPrice} from 'src/Common/Helpers/formatPrice'
import {
  createFolder,
  listFolder,
  about,
  list,
  uploadFile,
  destroy,
} from './googleDrive/gdrive'
import {ServiceUpdateFileStatusDto} from './dto/service.updateFileStatus.dto'
import {Server, Socket} from 'socket.io'
import {SocketService} from 'src/Socket/socket.service'
import {ClientsService} from '../Clients/clients.service'
import {DocumentChangeStatusDto} from './dto/documentChangeStatus.dto'
import {moveFileGoogleDrive} from './googleDrive/moveFileFolderClient'
import {isDevelopmentEnvironment} from 'src/Common/Functions'

@Injectable()
export class ServiceService {
  private logger = new Logger()

  constructor(
    @InjectModel(OrderService.name)
    private serviceModel: Model<ServiceDocument>,
    private readonly socketService: SocketService,
    private readonly clientsService: ClientsService,
  ) {}

  async create(createServiceDto: ServiceDto, user: string) {
    createServiceDto = {
      ...createServiceDto,
      user,
    }
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

  async moveFileGoogleDrive(data: DocumentChangeStatusDto) {
    if (data.idFileCreatedGoogleDrive) {
      /** Send socket to Frontend */
      const io = this.socketService.getIo()
      io.emit('update-os-orcamento', 'updateFileStatus')
      const resultClient = await this.clientsService.findOne(data.clientId)

      if (data.typeDocument === 'ORCAMENTO') {
        await moveFileGoogleDrive(
          data.idFileCreatedGoogleDrive,
          [resultClient?.idFolderOrcamento],
          [resultClient?.idFolderOsPagas, resultClient?.idFolderOsPendentes],
        )
      } else {
        if (data.status === 'PAGO') {
          await moveFileGoogleDrive(
            data.idFileCreatedGoogleDrive,
            [resultClient?.idFolderOsPagas],
            [
              resultClient?.idFolderOrcamento,
              resultClient?.idFolderOsPendentes,
            ],
          )
        }
        if (data.status === 'PENDENTE') {
          await moveFileGoogleDrive(
            data.idFileCreatedGoogleDrive,
            [resultClient?.idFolderOsPendentes],
            [resultClient?.idFolderOsPagas, resultClient?.idFolderOrcamento],
          )
        }
      }
    } else {
      await this.updateFileStatus(data.id, {
        dateGeneratedOS: 'PDF AINDA NÃO EXISTE',
      })

      /** Send socket to Frontend */
      const io = this.socketService.getIo()
      io.emit('update-os-orcamento', 'updateFileStatus')
    }
  }

  async getIncomeMaturityOfTheBoleto() {
    const today = new Date()
    const threeDaysFromNow = addDays(today, 3)
    let count = 0
    const incomes = await this.serviceModel.find()
    incomes.forEach((income) => {
      const maturityDate = parse(
        income.maturityOfTheBoleto || '',
        'dd/MM/yyyy',
        new Date(),
      )
      if (income.status === 'PENDENTE' && income.formOfPayment === 'Boleto') {
        if (
          isWithinInterval(maturityDate, {start: today, end: threeDaysFromNow})
        ) {
          count++
        }
      }
    })

    return {count}
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

  async updateFileStatus(
    id: string,
    updateServiceDto: ServiceUpdateFileStatusDto,
    user?: string,
  ) {
    try {
      await this.serviceModel.updateOne(
        {
          _id: id,
        },
        {
          $set: {
            ...updateServiceDto,
            user: user || '',
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
  async updateIdFileCreatedGoogleDrive(
    id: string,
    idFileCreatedGoogleDrive: string,
  ) {
    try {
      await this.serviceModel.updateOne(
        {
          _id: id,
        },
        {
          $set: {
            idFileCreatedGoogleDrive,
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

  async deleteOSByClientId(clientId: string) {
    try {
      const resultOrderService = await this.serviceModel.find()
      resultOrderService.forEach(async (os) => {
        if (os.client.id === clientId) {
          await this.serviceModel.deleteOne({_id: os._id})
        }
      })
    } catch (error) {
      throw new HttpException(
        {
          message: error,
        },
        HttpStatus.EXPECTATION_FAILED,
      )
    }
  }

  async remove(id: string, idFileCreatedGoogleDrive?: string) {
    try {
      this.logger.log(
        `[Sistema] - Excluindo a Ordem de Servico/Orcamento ${id}...`,
      )
      await this.serviceModel.deleteOne({_id: id})
      if (idFileCreatedGoogleDrive !== 'undefined') {
        this.logger.log(`[Sistema] - Excluindo o arquivo do Google Drive...`)
        await destroy({fileId: idFileCreatedGoogleDrive})
      } else {
        this.logger.log(
          `[Sistema] - ID do arquivo não vinculado a Ordem de Servico/Orcamento`,
        )
      }
      this.logger.log(`[Sistema] - Procedimento finalizado com sucesso.`)
      this.logger.log(`✅-----------------------------------✅`)
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
            this.logger.log(
              `[Sistema] - Arquivo ${file.name} excluido com sucesso dentro da pasta ${folderName}`,
            )
            /** Delete o arquivo */
            await destroy({fileId: file.id})
          }
        })
      }
    } catch (error) {
      this.logger.log(error)
      throw new HttpException(
        {
          message: error,
        },
        HttpStatus.EXPECTATION_FAILED,
      )
    }
  }

  async uploadFile(
    idFolder: string,
    fileName: string,
    status: string,
    idOrderService?: string,
  ) {
    try {
      const result = await list({parents: idFolder})
      const filePath = path.join(__dirname, '..', 'pdfs', fileName)

      const resultFilderFileName = result.files.filter(
        (file) => file.name === `${fileName}.pdf`,
      )
      if (!resultFilderFileName.length) {
        /** Quando não encontrar o arquivo */
        /** Fazer o upload do arquivo */
        this.logger.log(
          `[Sistema] - Fazendo o upload do arquivo ${fileName} no Google drive...`,
        )
        const resultFileCreated = await uploadFile({
          fileName: `${fileName}.pdf`,
          filePath: `${filePath}.pdf`,
          parents: idFolder,
        })
        await this.deleteFile(fileName)
        const idFileCreated = resultFileCreated.id
        if (idOrderService) {
          await this.updateIdFileCreatedGoogleDrive(
            idOrderService,
            idFileCreated,
          )
        }
      } else {
        /** Quando encontrar o arquivo */
        /** Excluir o arquivo e fazer o upload do novo arquivo */
        const {id} = resultFilderFileName[0]
        await destroy({fileId: id})
        this.logger.log(
          `[Sistema] - Fazendo o upload do arquivo ${fileName} no Google drive...`,
        )
        const resultFileCreated = await uploadFile({
          fileName: `${fileName}.pdf`,
          filePath: `${filePath}.pdf`,
          parents: idFolder,
        })
        await this.deleteFile(fileName)
        const idFileCreated = resultFileCreated.id
        if (idOrderService) {
          await this.updateIdFileCreatedGoogleDrive(
            idOrderService,
            idFileCreated,
          )
        }
      }
    } catch (error) {
      this.logger.log(error)
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
      this.logger.log(error)
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
      this.logger.log(
        `[Sistema] - Verificando se pasta ORÇAMENTOS já existe...`,
      )
      await this.createFolder(idFolder, 'ORÇAMENTOS', filename, status)
    } else {
      if (status === 'PAGO') {
        /** Cria a pasta O.S PAGAS */
        this.logger.log(
          `[Sistema] - Verificando se pasta O.S PAGAS já existe...`,
        )
        await this.createFolder(idFolder, 'O.S PAGAS', filename, status)
        /** Deleta o arquivo dentro da pasta O.S PENDENTES para evitar ficar em duas pastas ao mesmo tempo*/
        await this.deleteFileByStatusFolder('O.S PENDENTES', idFolder, filename)
      }
      if (status === 'PENDENTE') {
        /** Cria a pasta O.S PENDENTES */
        this.logger.log(
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
      this.logger.log(
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

  async saveFilerGoogleDrive(
    status: string,
    typeDocument: string,
    filename: string,
    idFolderOsPagas: string,
    idFolderOsPendentes: string,
    idFolderOrcamento: string,
    idFolderOsUnificadas: string,
    idFolderClientName: string,
    idOrderService: string,
  ) {
    try {
      if (typeDocument === 'ORCAMENTO') {
        await this.uploadFile(
          idFolderOrcamento,
          filename,
          status,
          idOrderService,
        )
      } else {
        if (status === 'PAGO') {
          await this.uploadFile(
            idFolderOsPagas,
            filename,
            status,
            idOrderService,
          )
          await this.deleteFileByStatusFolder(
            'O.S PENDENTES',
            idFolderClientName,
            filename,
          )
        }
        if (status === 'PENDENTE') {
          await this.uploadFile(
            idFolderOsPendentes,
            filename,
            status,
            idOrderService,
          )
          await this.deleteFileByStatusFolder(
            'O.S PAGAS',
            idFolderClientName,
            filename,
          )
        }
      }
    } catch (error) {
      this.logger.log(error)
      throw new HttpException(
        {
          message: error,
        },
        HttpStatus.EXPECTATION_FAILED,
      )
    }
  }

  async saveFileInFolderGoogleDrive(
    clientName: string,
    status: string,
    typeDocument: string,
    filename: string,
  ) {
    const ID_FOLDER_MAIN = isDevelopmentEnvironment()
      ? process.env.ID_FOLDER_MAIN_GOOGLE_DRIVE_DEVELOPMENT
      : process.env.ID_FOLDER_MAIN_GOOGLE_DRIVE
    try {
      this.logger.log(
        '[Sistema] - Verificando se a pasta CLIENTES já existe...',
      )
      const listResult = await listFolder({
        parents: ID_FOLDER_MAIN,
      })
      /** Se não existir a pasta CLIENTES */
      if (!listResult.files.length) {
        this.logger.log('[Sistema] - Criando a pasta CLIENTES...')
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
      this.logger.log(error)
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

    fs.access(filePath, fs.constants.F_OK, (error) => {
      if (error) {
        console.error('O arquivo não existe:', error)
        return
      }

      fs.unlink(filePath, (error) => {
        if (error) {
          console.error('Erro ao excluir o arquivo:', error)
          return
        }

        this.logger.log('Arquivo excluído com sucesso:', filePath)
      })
    })

    // fs.unlink(filePath, (error) => {
    //   if (error) {
    //     console.error('Erro ao excluir o arquivo:', error)
    //     return
    //   }
    // })
  }

  async getCurrentDateAndHour() {
    const now = new Date()
    return format(now, 'dd/MM/yyyy HH:mm')
  }

  /**
   * @description Antiga função para salvar o documento do drive. Não está sendo mais usado.
   */
  async savePDF_old(
    id: string,
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
      this.logger.log('[Sistema] - Salvando o arquivo .pdf no servidor...')
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
        this.logger.log(
          '[Sistema] - Iniciando o processo de upload no Google Drive...',
        )
        await this.saveFileInFolderGoogleDrive(
          clientName,
          status,
          typeDocument,
          filename,
        )
        this.logger.log(`[Sistema] - Procedimento finalizado com sucesso.`)
        this.logger.log(`✅-----------------------------------✅`)
        await this.updateFileStatus(id, {
          dateGeneratedOS: await this.getCurrentDateAndHour(),
        })

        /** Send socket to Frontend */
        const io = this.socketService.getIo()
        io.emit('update-os-orcamento', 'updateFileStatus')
      }, 30000)
    } catch (error) {
      this.logger.log(`[Sistema] - Houve um erro: ${error}`)
      await this.updateFileStatus(id, {
        dateGeneratedOS: 'HOUVE UM ERRO, TENTE NOVAMENTE',
      })
      throw new HttpException(
        {
          message: error,
        },
        HttpStatus.EXPECTATION_FAILED,
      )
    }
  }

  async savePDF(
    idOrderService: string,
    base64: string,
    filename: string,
    clientName: string,
    status: string,
    typeDocument: string,
    idClient: string,
    user: string,
  ): Promise<void> {
    try {
      const folderPath = path.join(__dirname, '..', 'pdfs')
      // Cria o diretório "pdfs" caso ele não exista
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath)
      }
      this.logger.log(
        `[Sistema] - Convertendo o arquivo ${filename} de base64 em PDF...`,
      )
      const filePath = path.join(__dirname, '..', 'pdfs', filename)
      const pdfData = base64.split(';base64,').pop()

      /**
       * @description Converte o base64 em arquivo .pdf
       */
      this.logger.log(
        `[Sistema] - Salvando o arquivo ${filename} no servidor...`,
      )
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
      this.logger.log(
        '[Sistema] - Iniciando o processo de upload no Google Drive...',
      )
      this.logger.log('[Sistema] - Buscando o ID da pasta do cliente...')

      const resultClient = await this.clientsService.findOne(idClient)
      const idFolderOsPagas = resultClient?.idFolderOsPagas
      const idFolderClientName = resultClient?.idFolderClientName
      const idFolderOsPendentes = resultClient?.idFolderOsPendentes
      const idFolderOrcamento = resultClient?.idFolderOrcamento
      const idFolderOsUnificadas = resultClient?.idFolderOsUnificadas

      await this.saveFilerGoogleDrive(
        status,
        typeDocument,
        filename,
        idFolderOsPagas,
        idFolderOsPendentes,
        idFolderOrcamento,
        idFolderOsUnificadas,
        idFolderClientName,
        idOrderService,
      )
      this.logger.log(`[Sistema] - Procedimento finalizado com sucesso.`)
      this.logger.log(`✅-----------------------------------✅`)
      await this.updateFileStatus(
        idOrderService,
        {
          dateGeneratedOS: await this.getCurrentDateAndHour(),
        },
        user,
      )

      /** Send socket to Frontend */
      const io = this.socketService.getIo()
      io.emit('update-os-orcamento', 'updateFileStatus')
    } catch (error) {
      this.logger.log(`[Sistema] - Houve um erro: ${error}`)
      await this.updateFileStatus(
        idOrderService,
        {
          dateGeneratedOS: 'HOUVE UM ERRO',
        },
        user,
      )

      /** Send socket to Frontend */
      const io = this.socketService.getIo()
      io.emit('update-os-orcamento', 'updateFileStatus')
      await this.deleteFile(filename)
      throw new HttpException(
        {
          message: error,
        },
        HttpStatus.EXPECTATION_FAILED,
      )
    }
  }
}
