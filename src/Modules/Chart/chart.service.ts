import {Injectable} from '@nestjs/common'
import {format, parse} from 'date-fns'
import {ptBR} from 'date-fns/locale'
import {formatInputPrice} from 'src/Common/Helpers/formatPrice'
import {ExpenseService} from '../Expense/expenses.service'
import {ServiceService} from '../OrderService/services.service'

type DataChart = {
  Month: string
  incomes: number
  expenses: number
  personal_expenses: number
}

@Injectable()
export class ChartService {
  constructor(
    private readonly expense: ExpenseService,
    private readonly orderService: ServiceService,
  ) {}

  /**
   * @description
   * Realizar a filtragem e retorna os ultimos 3 meses
   */
  filterMonthsWithData(finalResult: any[]) {
    const filteredMonths = finalResult.filter((item) => {
      const {incomes, expenses, personal_expenses} = item
      return incomes !== 0 || expenses !== 0 || personal_expenses !== 0
    })
    const lastIndex = filteredMonths.length - 1
    const lastThreeMonths = filteredMonths.slice(lastIndex - 3, lastIndex + 1)
    return lastThreeMonths
  }

  processingData(
    orderServiceChartResult: any[],
    expenseChartResult: any[],
    personalExpenseChartResult: any[],
  ) {
    // Criar um array com todos os meses do ano
    const months = [
      'JAN',
      'FEV',
      'MAR',
      'ABR',
      'MAI',
      'JUN',
      'JUL',
      'AGO',
      'SET',
      'OUT',
      'NOV',
      'DEZ',
    ]

    // Inicializar um objeto vazio para armazenar as informações dos meses
    const result: {[key: string]: any} = {}
    // Preencher o objeto result com as informações dos meses
    months.forEach((month) => {
      result[month] = {
        month: month,
        incomes: 0,
        expenses: 0,
        personal_expenses: 0,
      }
    })
    // Preencher o objeto result com as informações dos objetos originais
    orderServiceChartResult.forEach(({month, incomes}) => {
      result[month].incomes = incomes
    })

    expenseChartResult.forEach(({month, expenses}) => {
      result[month].expenses = expenses
    })

    personalExpenseChartResult.forEach(({month, personal_expenses}) => {
      result[month].personal_expenses = personal_expenses
    })
    // Calcular o lucro (profit) e arredondar para 2 casas decimais
    Object.values(result).forEach((item) => {
      item.profit = Number((item.incomes - item.expenses).toFixed(2))
    })

    // Converter o objeto result em um array
    const resultChart = Object.values(result)
    return this.filterMonthsWithData(resultChart)
  }

  async getChartData() {
    const resultOrderService = await this.orderService.findAllWithoutParam()
    const resultExpense = await this.expense.findAll()
    const {data: resultPersonalExpense} =
      await this.expense.findAllPersonalExpense()

    const totalMonth = {}
    const totalMonthExpense = {}
    const totalMonthPersonalExpense = {}

    let orderServiceChartResult = []
    let expenseChartResult = []
    let personalExpenseChartResult = []

    const currentYear = new Date().getFullYear() // Obter o ano atual

    resultOrderService.forEach((orderService) => {
      const orderServiceYear = parse(
        orderService.dateOS,
        'dd/MM/yyyy',
        new Date(),
      ).getFullYear()
      if (orderService.status === 'PAGO' && orderServiceYear === currentYear) {
        const dateOS = parse(orderService.dateOS, 'dd/MM/yyyy', new Date())
        const formatedMonth = format(dateOS, 'MMM', {locale: ptBR})
        const {clean} = formatInputPrice(orderService.total)
        if (totalMonth[formatedMonth]) {
          totalMonth[formatedMonth] += clean
        } else {
          totalMonth[formatedMonth] = clean
        }
      }
    })
    resultExpense.forEach((expense) => {
      const expenseYear = parse(
        expense.dateIn,
        'dd/MM/yyyy',
        new Date(),
      ).getFullYear()
      if (expense.status === 'PAGO' && expenseYear === currentYear) {
        const dateExpenseIn = parse(expense.dateIn, 'dd/MM/yyyy', new Date())
        const formatedMonth = format(dateExpenseIn, 'MMM', {locale: ptBR})
        const {clean} = formatInputPrice(expense.value)
        if (totalMonthExpense[formatedMonth]) {
          totalMonthExpense[formatedMonth] += clean
        } else {
          totalMonthExpense[formatedMonth] = clean
        }
      }
    })
    resultPersonalExpense.forEach((personalExpense) => {
      const personalExpenseYear = parse(
        personalExpense.dateIn,
        'dd/MM/yyyy',
        new Date(),
      ).getFullYear()
      if (personalExpenseYear === currentYear) {
        const dateExpenseIn = parse(
          personalExpense.dateIn,
          'dd/MM/yyyy',
          new Date(),
        )
        const formatedMonth = format(dateExpenseIn, 'MMM', {locale: ptBR})
        const {clean} = formatInputPrice(personalExpense.value)
        if (totalMonthPersonalExpense[formatedMonth]) {
          totalMonthPersonalExpense[formatedMonth] += clean
        } else {
          totalMonthPersonalExpense[formatedMonth] = clean
        }
      }
    })
    orderServiceChartResult = Object.entries(totalMonth).map(
      ([mes, total]) => ({
        month: String(mes).toUpperCase(),
        incomes: Number(Number(total).toFixed(2)),
      }),
    )
    expenseChartResult = Object.entries(totalMonthExpense).map(
      ([mes, total]) => ({
        month: String(mes).toUpperCase(),
        expenses: Number(Number(total).toFixed(2)),
      }),
    )
    personalExpenseChartResult = Object.entries(totalMonthPersonalExpense).map(
      ([mes, total]) => ({
        month: String(mes).toUpperCase(),
        personal_expenses: Number(Number(total).toFixed(2)),
      }),
    )
    return this.processingData(
      orderServiceChartResult,
      expenseChartResult,
      personalExpenseChartResult,
    )
  }
}
