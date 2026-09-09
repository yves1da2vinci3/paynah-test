import { Test, TestingModule } from '@nestjs/testing';
import { PaiementsController } from './paiements.controller.js';
import { PaiementsService } from './paiements.service.js';

describe('PaiementsController', () => {
  let paiementsController: PaiementsController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [PaiementsController],
      providers: [PaiementsService],
    }).compile();

    paiementsController = app.get<PaiementsController>(PaiementsController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(paiementsController.getHello()).toBe('Hello World!');
    });
  });
});
