import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { AuthGuard } from '@nestjs/passport'
import { AuthService } from '../AuthToken/auth/auth.service'
import { JwtAuthGuard } from '../AuthToken/auth/jwt-auth.guard'
import { CreateUserDto } from './Dto/create-user.dto'
import { UpdateUserDto } from './Dto/update-user.dto'
import { UsersService } from './users.service'

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private eventEmitter: EventEmitter2,
    private authService: AuthService,
  ) {}

  @Post('create')
  create(@Body() createUserDto: CreateUserDto) {
    // this.eventEmitter.emit('order.created', createUserDto)
    return this.usersService.create(createUserDto)
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.usersService.findAll()
  }

  @UseGuards(AuthGuard('local'))
  @Post('auth/login')
  async login(@Request() request) {
    /**
     * Search other data and inject in login method bellow.
     */
    return await this.authService.login(request.user)
  }

  @Patch('update/:id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    // return this.usersService.update(+id, updateUserDto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id)
  }
}
