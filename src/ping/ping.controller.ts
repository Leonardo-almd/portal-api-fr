import { Controller, Get } from '@nestjs/common';

@Controller('api/ping')
export class PingController {
  @Get()
  async ping() {
    return { message: 'pong' };
  }
}
