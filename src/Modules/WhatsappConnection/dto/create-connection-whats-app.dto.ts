import { IsBoolean, IsNotEmpty, IsString } from 'class-validator'

export class CreateConnectionWhatsAppDto {
  @IsNotEmpty({ message: 'Nome da conexao obrigatório!' })
  @IsString({ message: 'Nome da conexao precisa ser uma string' })
  public connectionName: string

  @IsString({ message: 'Mensagem de saudacao precisa ser uma string' })
  public greetingMessage: string

  @IsString({ message: 'Fila precisa ser uma string' })
  public queue: string

  @IsBoolean({ message: 'Número padrao precisa ser um boolean' })
  public defaultNumber: boolean

  public status: string

  public session: string

  public lastUpdate: string
}
