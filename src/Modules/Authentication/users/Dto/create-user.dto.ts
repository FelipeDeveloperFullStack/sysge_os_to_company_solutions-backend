import {IsArray, IsNotEmpty, IsOptional, IsString} from 'class-validator'
import {IPermissions} from '../Types'

export class CreateUserDto {
  @IsNotEmpty({message: 'Nome obrigatório!'})
  @IsString({message: 'Nome precisa ser uma string'})
  public name: string

  @IsOptional()
  @IsString({message: 'E-mail precisa ser uma string'})
  public email: string

  @IsNotEmpty({message: 'CPF obrigatório!'})
  public cpf: string

  @IsNotEmpty({message: 'Senha obrigatório!'})
  @IsString({message: 'E-mail precisa ser uma string'})
  public password: string

  @IsString({message: 'Tipo de usuário precisa ser uma string'})
  public typeUser: string = 'ADMIN'

  @IsString({message: 'Status do usuário precisa ser uma string'})
  public status: string = 'ATIVO'

  @IsOptional()
  public user: string

  @IsOptional()
  @IsArray()
  public permissions: IPermissions[]

  public token: any

  public isTokenValidated: boolean
}
