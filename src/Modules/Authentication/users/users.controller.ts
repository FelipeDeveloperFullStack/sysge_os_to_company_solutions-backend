import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  Post,
  Request,
  UseGuards,
  Query,
  Headers,
} from '@nestjs/common'
import {EventEmitter2} from '@nestjs/event-emitter'
import {AuthGuard} from '@nestjs/passport'
import {AuthService} from '../AuthToken/auth/auth.service'
import {JwtAuthGuard} from '../AuthToken/auth/jwt-auth.guard'
import {CreateUserDto} from './Dto/create-user.dto'
import {UpdateUserDto} from './Dto/update-user.dto'
import {UserFilterDto} from './Dto/user.filter.dto'
import {UsersService} from './users.service'

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private eventEmitter: EventEmitter2,
    private authService: AuthService,
  ) {}

  @Post('create')
  create(@Body() createUserDto: CreateUserDto, @Headers('user') user: string) {
    // this.eventEmitter?.emit('order.created', createUserDto)
    return this.usersService.create(createUserDto, user)
  }

  // @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Query() serviceParam: UserFilterDto) {
    return this.usersService.findAll(serviceParam)
  }

  @UseGuards(AuthGuard('local'))
  @Post('auth/login')
  async login(@Request() request) {
    /**
     * Search other data and inject in login method bellow.
     */
    return await this.authService.login(request.user)
  }

  @Put('update/:id')
  update(
    @Param('id') id: string,
    @Headers('user') user: string,
    @Body() updateUserDto: CreateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto, user)
  }
  @Put('update/status/:id')
  updateStatus(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Headers('user') user: string,
  ) {
    return this.usersService.updateStatus(id, updateUserDto, user)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id)
  }
}
