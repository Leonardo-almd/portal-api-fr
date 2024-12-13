import { Controller, Post, Get, UseGuards, Query, Body, Res, Request, ParseIntPipe, Param, Delete } from '@nestjs/common';
import { Response } from 'express';
import { InternationalShippingService } from './international-shipping.service';
import { AuthGuard } from '@nestjs/passport';
import puppeteer from 'puppeteer';
import { PermissionsGuard } from 'src/guards/permissions.guard';
import { Permissions } from '../decorators/permissions.decorator';
import { trimObjectStrings } from 'src/helpers/helpers';
import { InternationalShipping } from 'src/entities/international-shipping.entity';

type CreatePayload = Omit<InternationalShipping, 'created_at' | 'updated_at' | 'deleted_at'>;

@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Controller('api/international-shipping')
export class InternationalShippingController {
  constructor(private readonly service: InternationalShippingService) {}

  @Post()
  @Permissions('international-shipping')
  async create(@Body() payload: CreatePayload, @Request() req) {
    payload = trimObjectStrings(payload);
    return this.service.create(payload, req.user.id);
  }

  @Get(':id/export')
  @Permissions('international-shipping')
  async exportInvoices(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const html = await this.service.export(id);

    const browser = await puppeteer.launch({
      // executablePath: '/usr/bin/google-chrome', 
      // args: ['--no-sandbox', '--disable-setuid-sandbox'] // utilizar apenas em produção
    });
    const [page] = await browser.pages();
    await page.setContent(html as string, { waitUntil: 'load' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { bottom: 5, left: 5, top: 5, right: 5 },
    });

    await browser.close();

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename=frete_internacional.pdf',
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  }

  @Get()
  @Permissions('international-shipping')
  async findAll(
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('pageSize', ParseIntPipe) pageSize: number = 10,
    @Query('search') search: string,
  ) {
    const queryParams = {
      page: Number(page),
      pageSize: Number(pageSize),
      search: search?.trim(),
    };
    return this.service.findAll(queryParams);
  }

  @Delete(':id')
  @Permissions('international-shipping')
  async delete(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const requestingUserId = req.user.id;
    return this.service.delete(id, requestingUserId);
  }
}
