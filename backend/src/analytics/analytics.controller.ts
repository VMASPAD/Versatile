import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/auth.guard';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  async getOverview(@Request() req: any) {
    return this.analyticsService.getOverview(req.user.username, req.user.dbPassword);
  }

  @Get(':adId')
  async getAdAnalytics(@Request() req: any, @Param('adId') adId: string) {
    return this.analyticsService.getAdAnalytics(req.user.username, req.user.dbPassword, adId);
  }
}
