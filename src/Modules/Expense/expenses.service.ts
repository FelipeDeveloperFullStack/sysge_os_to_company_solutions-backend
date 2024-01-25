import {HttpException, HttpStatus, Injectable, Logger} from '@nestjs/common'
import {InjectModel} from '@nestjs/mongoose'
import {addDays, format, isBefore, isWithinInterval, parse} from 'date-fns'
import {ptBR} from 'date-fns/locale'
import {Model} from 'mongoose'
import {formatInputPrice} from 'src/Common/Helpers/formatPrice'
import {getMonthAbbreviation} from 'src/Common/Helpers/monthCurrentAbbreviation'
import {getMonthCurrentFormated} from 'src/Common/Helpers/monthCurrentFormated'
import {ExpenselDto} from './dto/expense.dto'
import {ExpenseFilterDto} from './dto/expense.filter.dto'
import {Expense as _Model, ModelDocument} from './entities/expense.entity'

@Injectable()
export class ExpenseService {

  private logger = new Logger()

  constructor(
    @InjectModel(_Model.name)
    private expenseModel: Model<ModelDocument>,
  ) {}

  async create(dto: ExpenselDto, user: string) {
    dto = {
      ...dto,
      user,
      expense: String(dto.expense.trim()).toUpperCase(),
      status: String(dto.status).toUpperCase(),
    }
    const model = new this.expenseModel(dto)

    try {
      model.save()
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

  async getSumTotalExpense() {
    const result = await this.expenseModel.find()
    const resultData = result.filter((item) => !item.isEnableToDontShowBeforeYearCurrent)
    const total = resultData.reduce((acc, item) => {
      const {clean} = formatInputPrice(item?.value)
      if (item.status === 'PAGO') {
        return acc + clean
      } else {
        return acc
      }
    }, 0)
    return {total: total}
  }

  async extractYear(dateString: string) {
    const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const match = dateString.match(regex);
    if (!match) {
        console.error("Invalid date format. Please use the format DD/MM/YYYY.");
        return null;
    }
    const year = parseInt(match[3], 10);
    return year;
}

  async updateAllRegisterExpensesToDontShowBeforeYearCurrent(isEnableToDontShowBeforeYearCurrent: boolean) {
    const expensesDataResult = await this.expenseModel.find()
    const currentYear = new Date().getFullYear()
    expensesDataResult.forEach(async (item) => {
      const year = await this.extractYear(item.dateIn)
      if (year < currentYear) {
        try {
          await this.expenseModel.updateOne(
            {
               _id: item._id,
            },
            {
              $set: {
                isEnableToDontShowBeforeYearCurrent
              },
            },
          )
        } catch (error) {
          this.logger.error(error)
          throw new HttpException(
            {
              message: error,
            },
            HttpStatus.EXPECTATION_FAILED,
          )
        }
      }
    })
  } 

  async getSumTotalExpenseType() {
    const resultExpense = await this.expenseModel.find()
    const resultData = resultExpense.filter((item) => !item.isEnableToDontShowBeforeYearCurrent)
    const currentMonthAbbreviation = getMonthAbbreviation()

    const totalExpenseEmpresa = resultData.reduce((acc, item) => {
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

    const totalExpensePessoal = resultData.reduce((acc, item) => {
      const dateExpenseIn = parse(item.dateIn, 'dd/MM/yyyy', new Date())
      const formatedMonth = format(dateExpenseIn, 'MMM', {locale: ptBR})
      if (formatedMonth === currentMonthAbbreviation) {
        const {clean} = formatInputPrice(item?.value)
        if (item.status === 'PAGO' && item?.expense_type === 'Pessoal') {
          return acc + clean
        } else {
          return acc
        }
      } else {
        return acc
      }
    }, 0)

    return {
      totalExpenseEmpresa,
      totalExpensePessoal,
      month: getMonthCurrentFormated(),
    }
  }

  async findAll(filter?: ExpenseFilterDto) {
    // if (filter) {
    //   const service = {
    //     expense: new RegExp(filter.expense, 'i'),
    //   }
    //   return await this.expenseModel.find(service)
    // } else {
    //   return await this.expenseModel.find()
    // }

    let query = this.expenseModel.find()

    if (filter && filter.expense) {
      const service = {
        expense: new RegExp(filter.expense, 'i'),
      }
      query = query.find(service)
    }

    // Ordenando por "dateIn" em ordem crescente (do mais antigo para o mais recente)
    query = query.sort({dateIn: -1})

    const result = await query.exec()
    return result.filter((item) => !item.isEnableToDontShowBeforeYearCurrent)
  }

  async findAllPersonalExpense() {
    const resultExpense = await this.expenseModel.find()
    const resultData = resultExpense.filter((item) => !item.isEnableToDontShowBeforeYearCurrent)

    // const regexConta = /CONTA:\s*9707453-5/g
    const expenseType = 'Pessoal'
    let totalSum = 0
    const expenseList = []
    resultData.forEach((expense) => {
      // const match = expense.expense.match(regexConta)
      const match = expense?.expense_type?.trim() === expenseType
      if (match) {
        const {clean} = formatInputPrice(expense.value)
        totalSum += clean
        expenseList.push({
          description: expense.expense,
          value: expense.value,
          dateIn: expense.dateIn,
        })
      }
    })

    return {total: totalSum, data: expenseList}
  }

  async findOne(id: string) {
    return await this.expenseModel.findOne({_id: id})
  }

  async findOneIdNubank(idNubank: string) {
    return await this.expenseModel.findOne({idNubank})
  }

  async update(id: string, dto: ExpenselDto, user: string) {
    try {
      await this.expenseModel.updateOne(
        {
          _id: id,
        },
        {
          $set: {
            user,
            ...dto,
            status: dto?.status && String(dto?.status).toUpperCase(),
            expense_type: dto?.expense_type && dto?.expense_type,
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
      await this.expenseModel.deleteOne({_id: id})
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

  async removeByIdNubank(idNubank: string) {
    try {
      await this.expenseModel.deleteOne({idNubank})
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

  async getExpensesData() {
    const today = new Date()
    const threeDaysFromNow = addDays(today, 3)
    let total = 0
    let count = 0
    let expiredTotal = 0
    const expenses = await this.expenseModel.find()
    const resultData = expenses.filter((item) => !item.isEnableToDontShowBeforeYearCurrent)
    resultData.forEach((expense) => {
      const maturityDate = parse(
        expense.maturity || '',
        'dd/MM/yyyy',
        new Date(),
      )

      if (expense.status === 'A PAGAR') {
        if (isBefore(maturityDate, today)) {
          expiredTotal += parseFloat(
            expense.value.replace('R$ ', '').replace(',', '.'),
          )
        } else {
          total += parseFloat(
            expense.value.replace('R$ ', '').replace(',', '.'),
          )
        }
        if (
          isWithinInterval(maturityDate, {start: today, end: threeDaysFromNow})
        ) {
          count++
        }
      }
    })

    return {total, count, expiredTotal}
  }
}
