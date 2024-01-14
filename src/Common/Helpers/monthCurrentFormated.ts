import {format, isThisMonth} from 'date-fns'
import {ptBR} from 'date-fns/locale'

export function getMonthCurrentFormated() {
  const currentDate = new Date()
  if (isThisMonth(currentDate)) {
    return format(currentDate, 'MMMM', {locale: ptBR})
  } else {
    return ''
  }
}
