import { Test, TestingModule } from '@nestjs/testing';
import { MisReportsController } from './mis-reports.controller';
import { MisReportsService } from './mis-reports.service';

describe('MisReportsController', () => {
  let misReportsController: MisReportsController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [MisReportsController],
      providers: [MisReportsService],
    }).compile();

    misReportsController = app.get<MisReportsController>(MisReportsController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(misReportsController.getHello()).toBe('Hello World!');
    });
  });
});
