import { Controller, Post, Get, Body, Param, Req, Res, UseGuards, Request, Logger } from '@nestjs/common';
import { TrackerService } from './tracker.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import type { Response, Request as ExpressRequest } from 'express';

// 1x1 transparent PNG pixel
const PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);

@Controller('track')
export class TrackerController {
  private readonly logger = new Logger(TrackerController.name);

  constructor(private readonly trackerService: TrackerService) {}

  /**
   * Public endpoint — called by the embed widget.
   * No credentials needed; the tracker resolves them from the registry.
   */
  @Post('event')
  async trackEvent(@Body() body: any, @Req() req: ExpressRequest) {
    const event = {
      adId: body.adId,
      eventType: body.eventType,
      duration: body.duration,
      viewportPercent: body.viewportPercent,
      referrer: body.referrer || req.headers.referer || '',
      userAgent: body.userAgent || req.headers['user-agent'] || '',
      ip: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '',
      screenWidth: body.screenWidth,
      screenHeight: body.screenHeight,
      pageUrl: body.pageUrl,
      scrollDepth: body.scrollDepth,
    };

    this.logger.log(`Received [${event.eventType}] for Ad [${event.adId}] from IP ${event.ip} on URL: ${event.pageUrl || event.referrer}`);

    await this.trackerService.trackEvent(event);
    return { ok: true };
  }

  /**
   * Tracking pixel — 1x1 transparent PNG for email/fallback tracking.
   */
  @Get('pixel/:adId')
  async pixel(@Param('adId') adId: string, @Req() req: ExpressRequest, @Res() res: Response) {
    res.set({
      'Content-Type': 'image/png',
      'Content-Length': PIXEL.length.toString(),
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    });
    res.end(PIXEL);
  }

  /**
   * Widget endpoint — returns the ad data for embed script generation in the dashboard.
   */
  @UseGuards(JwtAuthGuard)
  @Get('embed-config/:adId')
  async getEmbedConfig(@Request() req: any, @Param('adId') adId: string) {
    return { adId, username: req.user.username };
  }
}
