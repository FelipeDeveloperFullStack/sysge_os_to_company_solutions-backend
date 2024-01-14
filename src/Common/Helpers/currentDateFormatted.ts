import {format} from 'date-fns'

export function getCurrentDateFormatted(): string {
  const currentDate = new Date()
  const formattedDate = format(currentDate, 'dd/MM/yyyy')
  return formattedDate
}
