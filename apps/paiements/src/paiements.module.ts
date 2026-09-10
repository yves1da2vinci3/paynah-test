import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaiementsController } from './paiements.controller.js';
import { PaiementsService } from './paiements.service.js';
import { validatePaiementsEnv } from './infrastructure/config/env.validation.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate: validatePaiementsEnv,
    }),
  ],
  controllers: [PaiementsController],
  providers: [PaiementsService],
})
export class PaiementsModule {}
