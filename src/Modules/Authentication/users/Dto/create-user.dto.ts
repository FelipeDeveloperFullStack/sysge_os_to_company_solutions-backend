import { IsNotEmpty, IsString } from "class-validator";

export class CreateUserDto {

  @IsNotEmpty({ message: 'Nome obrigatório!' })
  @IsString({ message: 'Nome precisa ser uma string' })
  public name: string

  @IsNotEmpty({ message: 'E-mail obrigatório!' })
  @IsString({ message: 'E-mail precisa ser uma string' })
  public email: string

  @IsNotEmpty({ message: 'CPF obrigatório!' })
  public cpf: number

  @IsNotEmpty({ message: 'Senha obrigatório!' })
  @IsString({ message: 'E-mail precisa ser uma string' })
  public password: string

  public token: any

  public isTokenValidated: boolean

}
