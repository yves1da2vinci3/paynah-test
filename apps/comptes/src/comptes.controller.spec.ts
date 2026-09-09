import { Test, TestingModule } from '@nestjs/testing';
import { ComptesController } from './comptes.controller.js';
import { ComptesService } from './comptes.service.js';

describe('ComptesController', () => {
  let comptesController: ComptesController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [ComptesController],
      providers: [ComptesService],
    }).compile();

    comptesController = app.get<ComptesController>(ComptesController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(comptesController.getHello()).toBe('Hello World!');
    });
  });
});
