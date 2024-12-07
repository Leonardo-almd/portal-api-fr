import { Test, TestingModule } from '@nestjs/testing';
import { InternationalShippingService } from './international-shipping.service';

describe('InternationalShippingService', () => {
  let service: InternationalShippingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InternationalShippingService],
    }).compile();

    service = module.get<InternationalShippingService>(InternationalShippingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
