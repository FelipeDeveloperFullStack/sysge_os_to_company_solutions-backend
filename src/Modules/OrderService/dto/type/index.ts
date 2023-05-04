export interface ClientT {
  name?: string
  cpfOrCnpj?: string
  email?: string
  phoneNumber?: string
  phoneNumberFixo?: string
  address?: string
  city?: string
  uf?: string
  cep?: string
}

export type ItemServices = {
  id: string
  description: string
  qtde: number
  unit: string
  total: number
}

export type Laudo = {
  checked: boolean
  description: string
  service: string
}

export type ItemPieces = {
  id: string
  description: string
  qtde: number
  unit: string
  total: number
}
