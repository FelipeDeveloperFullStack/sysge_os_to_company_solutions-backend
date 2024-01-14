import onlyNumbers from './onlyNumber'

type Price = {
  formated: string
  clean: number
}

const formatToApi = (value: string | number) => {
  return Number(
    String(value).replace('R$', '').replace('.', '').replace(',', '.'),
  )
}

const formatInputPriceOnChange = (value: string | number): Price => {
  let newValue: number | string = onlyNumbers(value)

  newValue = newValue.replace(/([0-9]{2})$/g, ',$1')

  if (newValue.length > 6) {
    newValue = newValue.replace(/([0-9]{3}),([0-9]{2}$)/g, '.$1,$2')
  }

  const formatedValue = newValue ? 'R$ ' + newValue : ''

  if (newValue === 'NaN') return null

  return {
    formated: formatedValue,
    clean: formatToApi(formatedValue),
  }
}

export const formatInputPrice = (price): Price => {
  if (!price && price !== 0) {
    return {} as Price
  }
  return formatInputPriceOnChange(price)
}

export const formatPrice = (value: String | number) => {
  if (value) {
    return Number(value).toLocaleString('pt-br', {
      style: 'currency',
      currency: 'BRL',
    })
  }
}
