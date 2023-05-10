import {HttpException, HttpStatus, Injectable} from '@nestjs/common'
import {InjectModel} from '@nestjs/mongoose'
import {Model} from 'mongoose'
import {ExpenselDto} from './dto/expense.dto'
import {ExpenseFilterDto} from './dto/expense.filter.dto'
import {Expense as _Model, ModelDocument} from './entities/expense.entity'

@Injectable()
export class ExpenseService {
  constructor(
    @InjectModel(_Model.name)
    private expenseModel: Model<ModelDocument>,
  ) {}

  async create(dto: ExpenselDto) {
    dto = {
      ...dto,
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

  async findAll(filter: ExpenseFilterDto) {
    // const service = {
    //   expense: new RegExp(filter.expense, 'i'),
    // }
    return await this.expenseModel.find()
  }

  async findOne(id: string) {
    return await this.expenseModel.findOne({_id: id})
  }

  async update(id: string, dto: ExpenselDto) {
    try {
      await this.expenseModel.updateOne(
        {
          _id: id,
        },
        {
          $set: {
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
}
