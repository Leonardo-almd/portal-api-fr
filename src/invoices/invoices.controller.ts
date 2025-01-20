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
import archiver from 'archiver';

type CreatePayload = Omit<Invoice, 'created_at' | 'updated_at' | 'deleted_at'>;

@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Controller('api/invoices')
export class InvoicesController {
  constructor(private readonly service: InvoicesService) {}

  @Post()
  @Permissions('invoice')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(@UploadedFile() file: Express.Multer.File, @Body() payload: CreatePayload, @Request() req) {
    if (!file && !payload.id) {
      throw new Error('Arquivo não encontrado.');
    }
    return this.service.createInvoice(file, payload, req.user.id);
  }

  @Get(':id/export')
  @Permissions('invoice')
  async exportInvoices(@Param('id', ParseIntPipe) id: number, @Query('model') model: string, @Res() res: Response) {
    const htmlInvoice = await this.service.export(id, model, 'invoice');
    const htmlPackingList = await this.service.export(id, model, 'packing-list');
  
    const browser = await puppeteer.launch({
      executablePath: '/usr/bin/google-chrome',
      args: ['--no-sandbox', '--disable-setuid-sandbox'] // usar apenas em produção
    });
  
    // Gerar PDF para a invoice
    const [pageInvoice] = await browser.pages();
    await pageInvoice.setContent(htmlInvoice as string, { waitUntil: 'load' });
    const pdfInvoice = await pageInvoice.pdf({
      format: 'A4',
      printBackground: true,
      margin: { bottom: 5, left: 5, top: 5, right: 5 },
    });
  
    // Gerar PDF para o packing list
    const [pagePackingList] = await browser.pages();
    await pagePackingList.setContent(htmlPackingList as string, { waitUntil: 'load' });
    const pdfPackingList = await pagePackingList.pdf({
      format: 'A4',
      printBackground: true,
      margin: { bottom: 5, left: 5, top: 5, right: 5 },
    });
  
    await browser.close();
  
    // Configuração para criar o arquivo ZIP
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename=invoices_and_packing-list.zip');
  
    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(res);
  
    // Adiciona os PDFs ao ZIP
    archive.append(pdfInvoice, { name: 'invoice.pdf' });
    archive.append(pdfPackingList, { name: 'packing-list.pdf' });
  
    // Finaliza o arquivo ZIP e envia
    await archive.finalize();
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
