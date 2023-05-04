import { Controller, Get, Query, Res } from '@nestjs/common';
import { AuthTokenService } from './auth-token.service';
import { Response } from 'express'

@Controller('auth')
export class AuthTokenController {
  constructor(private readonly authTokenService: AuthTokenService) {}

  @Get('confirm')
  async findOne(
    @Query('token') token: string, 
    @Res() res: Response
  ) {
     await this.authTokenService.validateTokenUser(token) 
     res.redirect('http://localhost:3001/auth/signin')
  }
}
