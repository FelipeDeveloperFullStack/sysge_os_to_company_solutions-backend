import { forwardRef, Module } from '@nestjs/common';
import { AuthTokenService } from './auth-token.service';
import { AuthTokenController } from './auth-token.controller';
import { UsersService } from '../users/users.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [forwardRef(() => UsersModule)],
  controllers: [AuthTokenController],
  providers: [AuthTokenService],
})
export class AuthTokenModule {}
