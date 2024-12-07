import { Test, TestingModule } from '@nestjs/testing';
import { InternationalShippingController } from './international-shipping.controller';

describe('InternationalShippingController', () => {
  let controller: InternationalShippingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InternationalShippingController],
    }).compile();

    controller = module.get<InternationalShippingController>(InternationalShippingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
