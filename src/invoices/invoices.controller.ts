// src/invoices/invoices.controller.ts
import { Controller, Post, Get, UploadedFile, UseInterceptors, UseGuards, Query, Body, Res, Request, ParseIntPipe, Param, Delete } from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { InvoicesService } from './invoices.service';
import { AuthGuard } from '@nestjs/passport';
import puppeteer from 'puppeteer';
import { Invoice } from 'src/entities/invoice.entity';
import { PermissionsGuard } from 'src/guards/permissions.guard';
import { Permissions } from '../decorators/permissions.decorator';

type CreatePayload = Omit<Invoice, 'created_at' | 'updated_at' | 'deleted_at'>;

@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Controller('api/invoices')
export class InvoicesController {
  constructor(private readonly service: InvoicesService) {}

  @Post()
  @Permissions('invoice')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(@UploadedFile() file: Express.Multer.File, @Body() payload: CreatePayload, @Request() req) {
    if (!file) {
      throw new Error('Arquivo não encontrado.');
    }
    return this.service.createInvoice(file, payload, req.user.id);
  }

  @Get(':id/export')
  @Permissions('invoice')
  async exportInvoices(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const html = await this.service.exportInvoice(id);

    const browser = await puppeteer.launch({
      executablePath: '/usr/bin/google-chrome', // utilizar apenas em produção
    });
    const [page] = await browser.pages();
    await page.setContent(html as string, { waitUntil: 'load' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { bottom: 5, left: 5, top: 5, right: 5 }
    });

    await browser.close();

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename=invoice.pdf',
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  }

  @Get()
  @Permissions('invoice')
  async findAll(@Query('page', ParseIntPipe) page: number = 1, @Query('pageSize', ParseIntPipe) pageSize: number = 10, @Query('search') search: string) {
    const queryParams = { page: Number(page), pageSize: Number(pageSize), search: search?.trim() };
    return this.service.findAll(queryParams);
  }

  @Delete(':id')
  @Permissions('invoice')
  async delete(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const requestingUserId = req.user.id;
    return this.service.delete(id, requestingUserId);
  }
}
