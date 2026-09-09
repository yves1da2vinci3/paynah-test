import { Controller, Get } from '@nestjs/common';
import { PaiementsService } from './paiements.service.js';

@Controller()
export class PaiementsController {
  constructor(private readonly paiementsService: PaiementsService) {}

  @Get()
  getHello(): string {
    return this.paiementsService.getHello();
  }
}
