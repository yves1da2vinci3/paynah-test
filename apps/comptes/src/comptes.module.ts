import { Module } from '@nestjs/common';
import { ComptesController } from './comptes.controller.js';
import { ComptesService } from './comptes.service.js';
import { ConfigModule } from '@nestjs/config';
import { validateComptesEnv } from './infrastructure/config/env.validation.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateComptesEnv,
      envFilePath: '.env',
    }),
  ],
  controllers: [ComptesController],
  providers: [ComptesService],
})
export class ComptesModule {}
