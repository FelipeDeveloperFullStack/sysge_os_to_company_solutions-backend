import {HttpException, HttpStatus, Injectable} from '@nestjs/common'
import {InjectModel} from '@nestjs/mongoose'
import {Model} from 'mongoose'
import {formatInputPrice, formatPrice} from 'src/Common/Helpers/formatPrice'
import {ExpenselDto} from './dto/expense.dto'
import {ExpenseFilterDto} from './dto/expense.filter.dto'
import {Expense as _Model, ModelDocument} from './entities/expense.entity'
import {parse, isWithinInterval, addDays, isBefore} from 'date-fns'

@Injectable()
export class ExpenseService {
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
    const total = result.reduce((acc, item) => {
      const {clean} = formatInputPrice(item?.value)
      if (item.status === 'PAGO') {
        return acc + clean
      } else {
        return acc
      }
    }, 0)
    return {total: total}
  }

  async findAll(filter?: ExpenseFilterDto) {
    if (filter) {
      const service = {
        expense: new RegExp(filter.expense, 'i'),
      }
      return await this.expenseModel.find(service)
    } else {
      return await this.expenseModel.find()
    }
  }

  async findAllPersonalExpense() {
    const resultExpense = await this.expenseModel.find()

    const regexConta = /CONTA:\s*9707453-5/g
    let totalSum = 0
    const expenseList = []
    resultExpense.forEach((expense) => {
      const match = expense.expense.match(regexConta)
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
            status: String(dto.status).toUpperCase(),
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
  async getExpensesData() {
    const today = new Date()
    const threeDaysFromNow = addDays(today, 3)
    let total = 0
    let count = 0
    let expiredTotal = 0
    const expenses = await this.expenseModel.find()
    expenses.forEach((expense) => {
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
