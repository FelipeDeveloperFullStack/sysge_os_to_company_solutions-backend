import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator'

export class ClientDto {
  @IsString({message: 'Nome precisa ser texto'})
  public name: string

  @IsString()
  public address: string

  @IsOptional()
  @IsString()
  public idFolderOsPagas: string

  @IsOptional()
  @IsString()
  public idFolderOsPendentes: string

  @IsOptional()
  @IsString()
  public idFolderOsUnificadas: string

  @IsOptional()
  @IsString()
  public idFolderOrcamento: string

  @IsOptional()
  @IsString()
  public idFolderClientName: string

  @IsOptional()
  public user: string

  @IsString()
  public city: string

  @IsString()
  public uf: string

  @IsString()
  public cpfOrCnpj: string | number

  @IsString()
  public email: string

  @IsString()
  public phoneNumber: string

  @IsOptional()
  @IsString()
  public phoneNumberFixo: string

  @IsString()
  public cep: string

  @IsBoolean()
  @IsOptional()
  public withoutEmail: boolean
}
