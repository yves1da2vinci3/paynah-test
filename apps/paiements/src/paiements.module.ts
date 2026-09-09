import { Module } from '@nestjs/common';
import { PaiementsController } from './paiements.controller.js';
import { PaiementsService } from './paiements.service.js';

@Module({
  imports: [],
  controllers: [PaiementsController],
  providers: [PaiementsService],
})
export class PaiementsModule {}
