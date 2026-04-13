import { Controller, Get, Param, Res, Req } from '@nestjs/common';
import { WidgetService } from './widget.service';
import type { Response, Request } from 'express';

@Controller()
export class WidgetController {
  constructor(private readonly widgetService: WidgetService) {}

  /**
   * Serve the embed script
   */
  @Get('widget/versatile.js')
  async getScript(@Res() res: Response) {
    const script = this.widgetService.getEmbedScript();
    res.set({
      'Content-Type': 'application/javascript',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
    });
    res.send(script);
  }

  /**
   * Public endpoint — fetch ad data by ID only (no credentials needed).
   */
  @Get('widget/ad/:adId')
  async getAdData(
    @Param('adId') adId: string,
    @Res() res: Response,
  ) {
    res.set({ 'Access-Control-Allow-Origin': '*' });

    const ad = await this.widgetService.getAdById(adId);
    if (!ad) {
      return res.status(404).json({ error: 'Ad not found or inactive' });
    }

    // Do NOT expose owner credentials to the client
    return res.json({
      id: ad.id,
      type: ad.type,
      content: ad.content,
      styles: ad.styles,
      targetUrl: ad.targetUrl,
      width: ad.width,
      height: ad.height,
    });
  }

  /**
   * Shortlink — 5 second countdown then redirect to target URL.
   * Example: GET /go/abc-123-uuid
   */
  @Get('go/:adId')
  async shortlink(
    @Param('adId') adId: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const ad = await this.widgetService.getAdById(adId);
    if (!ad || !ad.targetUrl) {
      return res.status(404).send('Ad not found');
    }

    const proto = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const apiBase = `${proto}://${host}`;

    const html = this.widgetService.getShortlinkPage(ad, apiBase);
    res.set({ 'Content-Type': 'text/html' });
    res.send(html);
  }
}
