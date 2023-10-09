import {HttpException, HttpStatus, Injectable, Logger} from '@nestjs/common'
import {InjectModel} from '@nestjs/mongoose'
import {addDays, format, isWithinInterval, parse} from 'date-fns'
import {ptBR} from 'date-fns/locale'
import * as fs from 'fs'
import {Model} from 'mongoose'
import * as os from 'os'
import * as path from 'path'
import {isDevelopmentEnvironment} from 'src/Common/Functions'
import clearSpecialCharacters from 'src/Common/Helpers/clearSpecialCharacters'
import {getCurrentDateFormatted} from 'src/Common/Helpers/currentDateFormatted'
import {removeAccents} from 'src/Common/Helpers/fileNameToDelete'
import {formatInputPrice} from 'src/Common/Helpers/formatPrice'
import {getMonthAbbreviation} from 'src/Common/Helpers/monthCurrentAbbreviation'
import {SocketService} from 'src/Socket/socket.service'
import {ClientsService} from '../Clients/clients.service'
import {ConfigurationSystemService} from '../Configurations/configurations.service'
import {ExpenselDto} from '../Expense/dto/expense.dto'
import {ExpenseService} from '../Expense/expenses.service'
import {DocumentChangeStatusDto} from './dto/documentChangeStatus.dto'
import {ServiceDto} from './dto/service.dto'
import {ServiceFilterDto} from './dto/service.filter.dto'
import {ServicePartialPaymentDto} from './dto/service.partial.payment.dto'
import {ServiceUpdateFileStatusDto} from './dto/service.updateFileStatus.dto'
import {OrderService, ServiceDocument} from './entities/service.entity'
import {
  createFolder,
  destroy,
  list,
  listFolder,
  uploadFile,
} from './googleDrive/gdrive'
import {moveFileGoogleDrive} from './googleDrive/moveFileFolderClient'
import {
  countAndDeletePDFs,
  deleteAllFilesInFolder,
  deleteMergedPDFs,
  mergePDFsInFolder,
} from './mergePdf'

@Injectable()
export class ServiceService {
  private logger = new Logger()

  constructor(
    @InjectModel(OrderService.name)
    private serviceModel: Model<ServiceDocument>,
    private readonly socketService: SocketService,
    private readonly clientsService: ClientsService,
    private readonly configurationSystemService: ConfigurationSystemService,
    private readonly expense: ExpenseService,
  ) {}

  async create(createServiceDto: ServiceDto, user: string) {
    if (createServiceDto && !Object.values(createServiceDto).length) {
      return
    }
    createServiceDto = {
      ...createServiceDto,
      user,
      description: createServiceDto?.description || '',
    }
    const service = new this.serviceModel(createServiceDto)

    if (createServiceDto?.isLaunchMoney === false) {
      const expenseData: ExpenselDto = {
        dateIn: getCurrentDateFormatted(), //
        expense: `[AJUSTE NAO DEPOSITADO EM CONTA] - ${
          createServiceDto?.description || createServiceDto?.client?.name
        }`,
        idNubank: null,
        maturity: createServiceDto?.maturityOfTheBoleto || null,
        status: createServiceDto.status === 'PENDENTE' ? 'A PAGAR' : 'PAGO',
        user: createServiceDto?.user,
        value: createServiceDto.total,
        expense_type: 'Empresa',
      }
      this.logger.log('[Sistema] - Salvando dados em despesa...')
      try {
        this.expense.create(expenseData, 'SISTEMA')
        this.logger.log('[Sistema] - Salvo com sucesso...')
      } catch (err) {
        this.logger.error(
          'Houve um erro ao tentar salvar os dados em despesa',
          err,
        )
      }
    }

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

  async updateOrderServicePartialPayment(
    servicePartialPaymentDto: ServicePartialPaymentDto,
    user: string,
  ) {
    servicePartialPaymentDto = {
      ...servicePartialPaymentDto,
      user,
    }

    const resultOrderService = await this.findOne(servicePartialPaymentDto.id)
    const currentOrderService = {
      isBoletoUploaded: resultOrderService.isBoletoUploaded,
      status: resultOrderService.status,
      typeDocument: resultOrderService.typeDocument,
      formOfPayment: servicePartialPaymentDto.remainingPaymentForm,
      osNumber: resultOrderService.osNumber,
      dateOS: resultOrderService.dateOS,
      dateGeneratedOS: resultOrderService.dateGeneratedOS,
      equipament: resultOrderService.equipament,
      brand: resultOrderService.brand,
      model: resultOrderService.model,
      serialNumber: resultOrderService.serialNumber,
      cable: resultOrderService.cable,
      charger: resultOrderService.charger,
      breaked: resultOrderService.breaked,
      detail: resultOrderService.detail,
      client: resultOrderService.client,
      itemServices: resultOrderService.itemServices,
      laudos: resultOrderService.laudos,
      itemPieces: resultOrderService.itemPieces,
      manpower: resultOrderService.manpower,
      discount: resultOrderService.discount,
      subTotal: resultOrderService.subTotal,
      remainingValue: servicePartialPaymentDto.remainingValue,
      valuePartial: servicePartialPaymentDto.valuePartial,
      total: servicePartialPaymentDto.remainingValue,
      user: resultOrderService.user,
      maturityOfTheBoleto: servicePartialPaymentDto.maturity,
      idFileCreatedGoogleDrive: resultOrderService.idFileCreatedGoogleDrive,
      isSendThreeDayMaturityBoleto:
        resultOrderService.isSendThreeDayMaturityBoleto,
      isSendNowDayMaturityBoleto: resultOrderService.isSendNowDayMaturityBoleto,
    }

    const newOrderServicePartialPayment = {
      isBoletoUploaded: resultOrderService.isBoletoUploaded,
      status: 'PAGO',
      typeDocument: resultOrderService.typeDocument,
      formOfPayment: servicePartialPaymentDto.paymentForm,
      osNumber: resultOrderService.osNumber,
      dateOS: resultOrderService.dateOS,
      dateGeneratedOS: resultOrderService.dateGeneratedOS,
      equipament: resultOrderService.equipament,
      brand: resultOrderService.brand,
      model: resultOrderService.model,
      serialNumber: resultOrderService.serialNumber,
      cable: resultOrderService.cable,
      charger: resultOrderService.charger,
      breaked: resultOrderService.breaked,
      detail: resultOrderService.detail,
      client: resultOrderService.client,
      itemServices: resultOrderService.itemServices,
      laudos: resultOrderService.laudos,
      itemPieces: resultOrderService.itemPieces,
      manpower: resultOrderService.manpower,
      discount: resultOrderService.discount,
      subTotal: resultOrderService.subTotal,
      remainingValue: servicePartialPaymentDto.remainingValue,
      valuePartial: servicePartialPaymentDto.valuePartial,
      total: servicePartialPaymentDto.valuePartial,
      user: resultOrderService.user,
      maturityOfTheBoleto:
        servicePartialPaymentDto.paymentForm === 'Boleto'
          ? resultOrderService.maturityOfTheBoleto
          : '',
      idFileCreatedGoogleDrive: resultOrderService.idFileCreatedGoogleDrive,
      isSendThreeDayMaturityBoleto:
        resultOrderService.isSendThreeDayMaturityBoleto,
      isSendNowDayMaturityBoleto: resultOrderService.isSendNowDayMaturityBoleto,
      isPartial: true,
    }

    this.logger.log('[SISTEMA] - Adicionando o recebimento parcial...')
    const service = new this.serviceModel(newOrderServicePartialPayment)

    try {
      service.save()
      await this.update(servicePartialPaymentDto.id, currentOrderService)
      this.logger.log('[SISTEMA] - Procedimento concluído')
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

  async findAllWithoutParam() {
    return await this.serviceModel.find()
  }

  async updateBoletoUploaded(osNumber: string, isBoletoUploaded: boolean) {
    try {
      await this.serviceModel.updateOne(
        {
          osNumber,
        },
        {
          $set: {
            isBoletoUploaded,
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

  async uploadBoleto(
    files: Express.Multer.File[],
    osNumber: string,
    clientId: string,
  ) {
    if (!files.length) {
      throw new HttpException(
        {
          message: 'Nenhum arquivo foi enviado.',
        },
        HttpStatus.EXPECTATION_FAILED,
      )
    }
    // Verificar se a pasta "boletos" já existe
    // const folderPath = path.join(__dirname, '..', 'boletos')
    const userHomeDir = os.homedir()
    const folderPath = path.join(userHomeDir, 'boletos')
    if (!fs.existsSync(folderPath)) {
      //fs.mkdirSync(folderPath)
      fs.mkdirSync(folderPath, {recursive: true})
    }
    try {
      files.forEach(async (file, index) => {
        // Renomear o arquivo com o número da ordem de serviço
        const newFileName = `${String(file.originalname)
          .toUpperCase()
          .replace('.PDF', '')} - REF.[OS ${osNumber}].pdf`
        const newFilePath = path.join(folderPath, newFileName)
        this.logger.log(
          `[Sistema] - Salvando o boleto ${newFileName} na pasta 'boleto'...`,
        )
        await fs.promises.writeFile(newFilePath, file.buffer)
        this.logger.log(
          `[Sistema] - 'Arquivo ${newFileName} salvo com sucesso!'`,
        )
        await this.updateBoletoUploaded(osNumber, true)
      })

      const data = await this.clientsService.findOne(clientId)
      const phoneNumber = `55${clearSpecialCharacters(data?.phoneNumber)}`

      setTimeout(async () => {
        if (phoneNumber) {
          try {
            this.logger.debug(
              `[Sistema] - Enviando notificação de cobranca no Whatsapp ${phoneNumber} referente a OS ${osNumber}...`,
            )
            await this.configurationSystemService.sendMidia(
              phoneNumber,
              osNumber,
            )
            this.logger.warn(
              `[Sistema] - Notificação de cobranca no Whatsapp enviada com sucesso.`,
            )
          } catch (error) {
            this.logger.error(
              `[Sistema] - Houve um erro ao enviar a notificacao de cobranca no Whatsapp ${phoneNumber} referente a OS ${osNumber}.`,
            )
          }
        } else {
          this.logger.error(
            `[Sistema] - Número de whatsapp não encontrado referente a OS ${osNumber}.`,
          )
        }
      }, 10000)

      return {message: 'ok'}
    } catch (error) {
      throw new HttpException(
        {
          message: error,
        },
        HttpStatus.EXPECTATION_FAILED,
      )
    }
  }

  async deleteFileByName(fileNameToDelete: string): Promise<boolean> {
    const userHomeDir = os.homedir()
    const folderPath = path.join(userHomeDir, 'boletos')

    try {
      const files = fs.readdirSync(folderPath)
      const matchingFiles = files.filter((fileName) =>
        removeAccents(fileName).includes(removeAccents(fileNameToDelete)),
      )

      if (matchingFiles.length === 0) {
        return false // File not found
      }

      await Promise.all(
        matchingFiles.map(async (fileName) => {
          const filePath = path.join(folderPath, fileName)
          await fs.promises.unlink(filePath)
        }),
      )

      return true // Successfully deleted the files
    } catch (err) {
      this.logger.error('[SISTEMA] - Error accessing the folder or files:', err)
      return false
    }
  }

  async getDocuments(
    orderNumber: string,
  ): Promise<{fileName: string; base64: string}[]> {
    const userHomeDir = os.homedir()
    const folderPath = path.join(userHomeDir, 'boletos')

    try {
      const files = fs.readdirSync(folderPath)
      const regex = new RegExp(`REF\\.\\[OS\\s+${orderNumber}\\]\\.pdf`, 'i')
      const matchingFiles = files.filter(
        (fileName) => regex.test(fileName) && fileName.endsWith('.pdf'),
      )

      if (matchingFiles.length === 0) {
        await this.updateBoletoUploaded(orderNumber, false)
        return []
      }

      const fileDataArray = await Promise.all(
        matchingFiles.map(async (fileName) => {
          const filePath = path.join(folderPath, fileName)
          const fileData = await fs.promises.readFile(filePath)
          const base64Data = fileData.toString('base64')
          return {fileName, base64: base64Data}
        }),
      )

      return fileDataArray
    } catch (err) {
      this.logger.error('[SISTEMA] - Error accessing the folder or files:', err)
      return []
    }
  }

  async findFileByOrderNumber(orderNumber: string): Promise<string | null> {
    //const folderPath = path.join('dist', 'Modules', 'boletos')
    const userHomeDir = os.homedir()
    const folderPath = path.join(userHomeDir, 'boletos')
    const fileName = `${orderNumber}.pdf`
    const filePath = path.join(folderPath, fileName)

    try {
      // Check if the file exists
      if (fs.existsSync(filePath)) {
        // Read the file and return the content as a Buffer
        return filePath
      } else {
        return null // File not found
      }
    } catch (err) {
      this.logger.error('[SISTEMA] - Error accessing the folder or file:', err)
      return null
    }
  }

  async getTotalBoletoNotImported() {
    const orderServices = await this.findAllWithoutParam()
    const orders = []
    for (let index = 0; index < orderServices.length; index++) {
      const element = orderServices[index]
      if (
        String(element.status).trim() === 'PENDENTE' &&
        String(element.formOfPayment).trim() === 'Boleto' &&
        !element.isBoletoUploaded &&
        String(element.description).trim() !== 'NOTINHA'
      ) {
        const hasBoletoFile = await this.findFileByOrderNumber(element.osNumber)
        if (!hasBoletoFile) {
          orders.push(element)
        }
      }
    }
    return orders
  }

  removeDuplicatesByProperty(arr: any[]): any[] {
    const uniqueMap = new Map<string, any>()
    arr.forEach((item) => {
      const key = item._id.toString()
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, item)
      }
    })
    return Array.from(uniqueMap.values())
  }

  async getTotalClientWithoutEmail() {
    const orderServices = await this.findAllWithoutParam()
    const clients = []
    for (let index = 0; index < orderServices.length; index++) {
      const element = orderServices[index]
      const clientId = element?.client?.id
      if (
        String(element.status).trim() === 'PENDENTE' &&
        String(element.formOfPayment).trim() === 'Boleto' &&
        String(element.description).trim() !== 'NOTINHA'
      ) {
        const result = await this.clientsService.findOne(clientId)
        if (result?.withoutEmail) {
          clients.push(result)
        }
      }
    }
    return this.removeDuplicatesByProperty(clients)
  }

  async findAll(serviceFilter: ServiceFilterDto) {
    return await this.serviceModel.find()
  }

  async callDeleteMergedPDFs(
    clientName: string,
    idClient: string,
    folderPath: string,
  ) {
    const fileName = `${clientName}-UNIFICADO`
    await deleteMergedPDFs(folderPath)

    const resultClient = await this.clientsService.findOne(idClient)
    const idFolderOsUnificadas = resultClient?.idFolderOsUnificadas

    await this.sendSocketMessageToFrontend(
      'Realizando a unificação, aguarde...',
    )
    await mergePDFsInFolder(folderPath, fileName, clientName)

    const filePath = path.join(__dirname, '..', 'pdfs', `${fileName}.pdf`)

    const result = await list({parents: idFolderOsUnificadas})

    const resultFilderFileName = result.files.filter(
      (file) => file.name === `${fileName}.pdf`,
    )

    if (!resultFilderFileName.length) {
      this.logger.log(
        `[Sistema] - Fazendo o upload do arquivo ${fileName} no Google drive...`,
      )
      await this.sendSocketMessageToFrontend(
        'Fazendo o upload do arquivo unificado no Google Drive, aguarde...',
      )
      await uploadFile({
        fileName: `${fileName}.pdf`,
        filePath: `${filePath}`,
        parents: idFolderOsUnificadas,
      })
    } else {
      const {id} = resultFilderFileName[0]
      await destroy({fileId: id})
      this.logger.log(
        `[Sistema] - Fazendo o upload do arquivo ${fileName} no Google drive...`,
      )
      await this.sendSocketMessageToFrontend(
        'Fazendo o upload do arquivo unificado no Google Drive, aguarde...',
      )
      await uploadFile({
        fileName: `${fileName}.pdf`,
        filePath: `${filePath}`,
        parents: idFolderOsUnificadas,
      })
    }
    await deleteAllFilesInFolder(folderPath, clientName)
    await this.sendSocketMessageToFrontend('')
  }

  async sendSocketMessageToFrontend(message: string) {
    /** Send socket to Frontend */
    const io = this.socketService.getIo()
    io?.emit('message-progress', message)
  }

  async mergePdf(length: number, clientName: string, idClient: string) {
    const folderPath = path.join(__dirname, '..', 'pdfs')
    await this.sendSocketMessageToFrontend(
      'Checando a quantidade de arquivos para realizar a unificação...',
    )
    const result = await countAndDeletePDFs(length, clientName, folderPath)
    if (result) {
      await this.callDeleteMergedPDFs(clientName, idClient, folderPath)
    }
  }

  async moveFileGoogleDrive(data: DocumentChangeStatusDto) {
    if (data.idFileCreatedGoogleDrive) {
      /** Send socket to Frontend */
      const io = this.socketService.getIo()
      io?.emit('update-os-orcamento', 'updateFileStatus')
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
      io?.emit('update-os-orcamento', 'updateFileStatus')
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
      if (
        income.status === 'PENDENTE' &&
        income.formOfPayment === 'Boleto' &&
        income.description !== 'NOTINHA'
      ) {
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

  async getTotalProftMonth() {
    const resultExpense = await this.expense.findAll()
    const currentMonthAbbreviation = getMonthAbbreviation()

    const totalExpenseEmpresa = resultExpense.reduce((acc, item) => {
      const dateExpenseIn = parse(item.dateIn, 'dd/MM/yyyy', new Date())
      const formatedMonth = format(dateExpenseIn, 'MMM', {locale: ptBR})
      if (formatedMonth === currentMonthAbbreviation) {
        const {clean} = formatInputPrice(item?.value)
        if (item.status === 'PAGO' && item?.expense_type === 'Empresa') {
          return acc + clean
        } else {
          return acc
        }
      } else {
        return acc
      }
    }, 0)
    const resultIncome = await this.serviceModel.find()
    const totalIncome = resultIncome.reduce((acc, item) => {
      const dateIncomeIn = parse(
        item?.dateClientPayment || item?.dateOS,
        'dd/MM/yyyy',
        new Date(),
      )
      const formatedMonth = format(dateIncomeIn, 'MMM', {locale: ptBR})
      const {clean} = formatInputPrice(item?.total)
      if (formatedMonth === currentMonthAbbreviation) {
        if (item.status === 'PAGO') {
          return acc + clean
        } else {
          return acc
        }
      } else {
        return acc
      }
    }, 0)

    return {totalProfitMonth: totalIncome - totalExpenseEmpresa}
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
    const totalPending = result.reduce((acc, item) => {
      const {clean} = formatInputPrice(item?.total)
      if (item.status === 'PENDENTE' && item.typeDocument !== 'ORCAMENTO') {
        return acc + clean
      } else {
        return acc
      }
    }, 0)
    return {total: total, totalPending}
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
      const orderService = await this.serviceModel.findOne({_id: id})
      if (updateServiceDto.status === 'PAGO') {
        await this.deleteFileByOrderNumber(orderService.osNumber)
        updateServiceDto = {
          ...updateServiceDto,
          isBoletoUploaded: false,
        }
      }
      if (updateServiceDto?.isLaunchMoney === false) {
        const expenseData: ExpenselDto = {
          dateIn: getCurrentDateFormatted(),
          expense: `[AJUSTE NAO DEPOSITADO EM CONTA] - ${
            updateServiceDto?.description || updateServiceDto?.client?.name
          }`,
          idNubank: null,
          maturity: updateServiceDto?.maturityOfTheBoleto || null,
          status: updateServiceDto.status === 'PENDENTE' ? 'A PAGAR' : 'PAGO',
          user: updateServiceDto?.user,
          value: updateServiceDto.total,
          expense_type: 'Empresa',
        }
        this.logger.log('[Sistema] - Salvando dados em despesa...')
        try {
          this.expense.create(expenseData, 'SISTEMA')
          this.logger.log('[Sistema] - Salvo com sucesso...')
        } catch (err) {
          this.logger.error(
            'Houve um erro ao tentar salvar os dados em despesa',
            err,
          )
        }
      }
      if (orderService?.osNumber) {
        updateServiceDto = {
          ...updateServiceDto,
          description: null,
        }
      }
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

  async updateStatusSendEmailSchedule(
    id: string,
    isSendThreeDayMaturityBoleto: boolean,
    isSendNowDayMaturityBoleto: boolean,
    isSendThreeDayAfterMaturityBoleto: boolean,
  ) {
    try {
      await this.serviceModel.updateOne(
        {
          _id: id,
        },
        {
          $set: {
            isSendThreeDayMaturityBoleto,
            isSendNowDayMaturityBoleto,
            isSendThreeDayAfterMaturityBoleto,
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

  async deleteFileByOrderNumber(orderNumber: string) {
    //const folderPath = path.join('dist', 'Modules', 'boletos')
    const userHomeDir = os.homedir()
    const folderPath = path.join(userHomeDir, 'boletos')
    //const fileName = `${orderNumber}.pdf`
    //const filePath = path.join(folderPath, fileName)

    const files = fs.readdirSync(folderPath)
    const matchingFiles = files.filter((fileName) => {
      const regex = /\[OS\s+(\d+)\]/i
      const match = fileName.match(regex)
      return match && match[1] === orderNumber
    })
    const filePaths = matchingFiles.map((fileName) => {
      return {
        path: path.join(folderPath, fileName),
      }
    })

    try {
      // Check if the file exists
      filePaths.forEach((path) => {
        if (fs.existsSync(path.path)) {
          // Delete the file
          fs.unlinkSync(path.path)
        }
      })
    } catch (err) {
      console.error('Error accessing the folder or file:', err)
      return false
    }
  }

  async remove(id: string, idFileCreatedGoogleDrive?: string) {
    try {
      this.logger.log(
        `[Sistema] - Excluindo a Ordem de Servico/Orcamento ${id}...`,
      )
      const orderService = await this.serviceModel.findOne({_id: id})

      await this.deleteFileByOrderNumber(orderService.osNumber)

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
    isMerge?: boolean,
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
        await this.deleteFile(fileName, isMerge)
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
        await this.deleteFile(fileName, isMerge)
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
    isMerge?: boolean,
  ) {
    try {
      if (typeDocument === 'ORCAMENTO') {
        await this.uploadFile(
          idFolderOrcamento,
          filename,
          status,
          idOrderService,
          isMerge,
        )
      } else {
        if (status === 'PAGO') {
          await this.uploadFile(
            idFolderOsPagas,
            filename,
            status,
            idOrderService,
            isMerge,
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
            isMerge,
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

  async deleteFile(fileName: string, isMerge: boolean) {
    const folderPath = path.join(__dirname, '..', 'pdfs')

    const filePath = path.join(folderPath, `${fileName}.pdf`)
    if (!isMerge) {
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
    }

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
        io?.emit('update-os-orcamento', 'updateFileStatus')
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
    isMerge: boolean,
  ) {
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
        isMerge,
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
      io?.emit('update-os-orcamento', 'updateFileStatus')
      return {
        status: HttpStatus.CREATED,
      }
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
      io?.emit('update-os-orcamento', 'updateFileStatus')
      await this.deleteFile(filename, isMerge)
      throw new HttpException(
        {
          message: error,
        },
        HttpStatus.EXPECTATION_FAILED,
      )
    }
  }
}
