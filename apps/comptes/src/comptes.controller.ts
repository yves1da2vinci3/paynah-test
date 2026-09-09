import { Controller, Get } from '@nestjs/common';
import { ComptesService } from './comptes.service.js';

@Controller()
export class ComptesController {
  constructor(private readonly comptesService: ComptesService) {}

  @Get()
  getHello(): string {
    return this.comptesService.getHello();
  }
}
