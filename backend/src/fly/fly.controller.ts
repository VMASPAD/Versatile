import { Controller, Post, Get, Delete, Body, Param, Req, Res, UseGuards, Request } from '@nestjs/common';
import { FlyService } from './fly.service';
import type { CreateFlyDto } from './fly.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import type { Response, Request as ExpressRequest } from 'express';

@Controller('fly')
export class FlyController {
  constructor(private readonly flyService: FlyService) {}

  /**
   * Public endpoint — Resolves a shortlink and renders the ad countdown page
   */
  @Get('go/:slug')
  async renderWaitPage(
    @Param('slug') slug: string,
    @Req() req: ExpressRequest,
    @Res() res: Response,
  ) {
    const record = await this.flyService.getPublicBySlug(slug);
    if (!record) {
      return res.status(404).send('Link not found');
    }

    // Increment click asynchronously
    this.flyService.incrementClicks(slug).catch(() => {});

    const proto = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const apiBase = `${proto}://${host}`;

    const html = this.flyService.renderWaitPage(record, apiBase);
    res.set({ 'Content-Type': 'text/html' });
    res.send(html);
  }
}

@UseGuards(JwtAuthGuard)
@Controller('api/fly')
export class ApiFlyController {
  constructor(private readonly flyService: FlyService) {}

  @Post()
  async create(@Request() req: any, @Body() dto: CreateFlyDto) {
    return this.flyService.create(req.user.username, req.user.dbPassword, dto);
  }

  @Get()
  async findAll(@Request() req: any) {
    return this.flyService.findAll(req.user.username, req.user.dbPassword);
  }

  @Delete(':id')
  async remove(@Request() req: any, @Param('id') id: string) {
    return this.flyService.remove(req.user.username, req.user.dbPassword, id);
  }
}
