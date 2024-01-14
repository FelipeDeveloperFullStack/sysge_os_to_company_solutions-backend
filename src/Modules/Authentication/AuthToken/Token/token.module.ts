import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { AuthService } from '../auth/auth.service';
import { UsersModule } from '../../users/users.module';
import { TokenController } from './token.controller';
import { Token, TokenSchema } from './token.entity';
import { TokenService } from './token.service';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    UsersModule,
    MongooseModule.forFeature([{ name: Token.name, schema: TokenSchema }]),
  ],
  controllers: [TokenController],
  providers: [TokenService],
  exports: [TokenService]
})
export class TokenModule {}
