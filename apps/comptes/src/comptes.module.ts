import { Module } from '@nestjs/common';
import { ComptesController } from './comptes.controller.js';
import { ComptesService } from './comptes.service.js';

@Module({
  imports: [],
  controllers: [ComptesController],
  providers: [ComptesService],
})
export class ComptesModule {}
