import {
  Body,
  Controller,
  Delete,
  Param,
  Post,
  Put,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Roles } from 'src/roles/roles.decorator';
import { CreateUserDto } from './dtos/create-user.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles('ROLE_ADMIN')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async createUser(@Body() createUserDto: CreateUserDto) {
    // The service method already handles errors (throwing HttpException, for example)
    return this.usersService.createUser({ ...createUserDto });
  }

  @Put(':id')
  @Roles('ROLE_ADMIN')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async updateUser(
    @Param('id') userId: string,
    @Body() updateUserDto: Partial<CreateUserDto>,
  ) {
    return this.usersService.updateUser(userId, { ...updateUserDto });
  }

  @Delete(':id')
  @Roles('ROLE_ADMIN')
  async deleteUser(@Param('id') userId: string) {
    return this.usersService.deleteUser(userId);
  }
}
