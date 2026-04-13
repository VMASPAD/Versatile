import { Injectable, Logger } from '@nestjs/common';
import { SarychDBService } from '../SarychDB';

export interface TrackEventDto {
  adId: string;
  eventType: 'impression' | 'click' | 'viewability' | 'shortlink_view';
  duration?: number;
  viewportPercent?: number;
  referrer?: string;
  userAgent?: string;
  ip?: string;
  screenWidth?: number;
  screenHeight?: number;
  pageUrl?: string;
  scrollDepth?: number;
}

@Injectable()
export class TrackerService {
  private readonly logger = new Logger(TrackerService.name);

  constructor(private readonly db: SarychDBService) {}

  async trackEvent(event: TrackEventDto) {
    // Resolve owner from registry
    const lookup = await this.db.lookupAd(event.adId);
    if (!lookup) {
      this.logger.warn(`Cannot track event: ad ${event.adId} not in registry`);
      return;
    }

    const record = {
      adId: event.adId,
      eventType: event.eventType,
      timestamp: new Date().toISOString(),
      duration: event.duration || 0,
      viewportPercent: event.viewportPercent || 0,
      referrer: event.referrer || '',
      userAgent: event.userAgent || '',
      ip: event.ip || '',
      screenWidth: event.screenWidth || 0,
      screenHeight: event.screenHeight || 0,
      pageUrl: event.pageUrl || '',
      scrollDepth: event.scrollDepth || 0,
    };

    try {
      await this.db.post(lookup.owner, lookup.ownerPass, 'events', record);
    } catch (err: any) {
      this.logger.error(`Failed to track event: ${err.message}`);
    }
  }
}
