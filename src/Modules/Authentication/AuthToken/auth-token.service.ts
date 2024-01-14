import { Injectable, Redirect, Req } from '@nestjs/common';
import { response } from 'express';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthTokenService {

  constructor(private readonly userService: UsersService) {}

  async validateTokenUser(token: string) {
   const user = await this.userService.findByToken(token)
   if (user){
     await this.userService.updateTokenUser(user?.token)
      return { url: 'http://localhost:3001/auth/signin' };
   } else {
     /**
      * return Websocket to frontend. User not found.
      */
   }
  }
}
