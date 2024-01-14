import {format, isThisMonth} from 'date-fns'
import {ptBR} from 'date-fns/locale'

export function getMonthAbbreviation() {
  const currentDate = new Date()
  if (isThisMonth(currentDate)) {
    return format(currentDate, 'MMM', {locale: ptBR})
  } else {
    return ''
  }
}
