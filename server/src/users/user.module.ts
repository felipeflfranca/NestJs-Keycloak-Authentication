import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'; // ✅ Importar ConfigModule
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [ConfigModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
