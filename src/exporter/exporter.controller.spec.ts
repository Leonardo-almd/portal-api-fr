import { Test, TestingModule } from '@nestjs/testing';
import { ExporterController } from './exporter.controller';

describe('ExporterController', () => {
  let controller: ExporterController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExporterController],
    }).compile();

    controller = module.get<ExporterController>(ExporterController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
