import {IsEmail, IsOptional, IsString} from 'class-validator'

export class ClientFilterDto {
  @IsString()
  @IsOptional()
  public name: string

  @IsString()
  @IsOptional()
  public address: string

  @IsString()
  @IsOptional()
  public city: string

  @IsString()
  @IsOptional()
  public uf: string

  @IsString()
  @IsOptional()
  public cpfOrCnpj: string

  @IsEmail()
  @IsOptional()
  public email: string

  @IsString()
  @IsOptional()
  public phoneNumber: string

  @IsString()
  @IsOptional()
  public phoneNumberFixo: string

  @IsString()
  @IsOptional()
  public cep: string
}
