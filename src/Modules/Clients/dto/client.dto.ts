import {IsEmail, IsNotEmpty, IsOptional, IsString} from 'class-validator'

export class ClientDto {
  @IsNotEmpty({message: 'Name is required'})
  public name: string

  @IsString()
  public address: string

  @IsString()
  public city: string

  @IsString()
  public uf: string

  @IsString()
  public cpfOrCnpj: string | number

  @IsEmail()
  public email: string

  @IsString()
  public phoneNumber: string

  @IsOptional()
  @IsString()
  public phoneNumberFixo: string

  @IsString()
  public cep: string
}
