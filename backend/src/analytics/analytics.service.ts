import { Injectable } from '@nestjs/common';
import { SarychDBService } from '../SarychDB';

@Injectable()
export class AnalyticsService {
  constructor(private readonly db: SarychDBService) {}

  async getOverview(username: string, password: string) {
    const events = await this.db.browse(username, password, 'events', 1, 10000);
    const allEvents: any[] = events.data || [];

    const impressions = allEvents.filter((e) => e.eventType === 'impression');
    const clicks = allEvents.filter((e) => e.eventType === 'click');
    const viewability = allEvents.filter((e) => e.eventType === 'viewability');

    const totalImpressions = impressions.length;
    const totalClicks = clicks.length;
    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

    const avgViewTime = viewability.length > 0
      ? viewability.reduce((sum: number, e: any) => sum + (e.duration || 0), 0) / viewability.length
      : 0;

    const avgViewport = viewability.length > 0
      ? viewability.reduce((sum: number, e: any) => sum + (e.viewportPercent || 0), 0) / viewability.length
      : 0;

    // Timeline: last 30 days
    const timeline = this.buildTimeline(allEvents, 30);

    // Top referrers
    const referrerMap: Record<string, number> = {};
    allEvents.forEach((e) => {
      const ref = e.referrer || 'Direct';
      referrerMap[ref] = (referrerMap[ref] || 0) + 1;
    });
    const topReferrers = Object.entries(referrerMap)
      .map(([referrer, count]) => ({ referrer, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Device breakdown
    const deviceMap: Record<string, number> = {};
    allEvents.forEach((e) => {
      const ua = (e.userAgent || '').toLowerCase();
      let device = 'Desktop';
      if (ua.includes('mobile') || ua.includes('android')) device = 'Mobile';
      else if (ua.includes('tablet') || ua.includes('ipad')) device = 'Tablet';
      deviceMap[device] = (deviceMap[device] || 0) + 1;
    });
    const devices = Object.entries(deviceMap).map(([device, count]) => ({ device, count }));

    // Hourly distribution
    const hourly = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      impressions: 0,
      clicks: 0,
    }));

    impressions.forEach((e: any) => {
      const h = new Date(e.timestamp).getHours();
      hourly[h].impressions++;
    });
    clicks.forEach((e: any) => {
      const h = new Date(e.timestamp).getHours();
      hourly[h].clicks++;
    });

    return {
      totalImpressions,
      totalClicks,
      ctr: Math.round(ctr * 100) / 100,
      avgViewTime: Math.round(avgViewTime),
      avgViewport: Math.round(avgViewport),
      viewabilityRate: totalImpressions > 0
        ? Math.round((viewability.length / totalImpressions) * 100)
        : 0,
      timeline,
      topReferrers,
      devices,
      hourly,
      totalEvents: allEvents.length,
    };
  }

  async getAdAnalytics(username: string, password: string, adId: string) {
    const events = await this.db.browse(username, password, 'events', 1, 10000);
    const allEvents: any[] = (events.data || []).filter((e: any) => e.adId === adId);

    const impressions = allEvents.filter((e) => e.eventType === 'impression');
    const clicks = allEvents.filter((e) => e.eventType === 'click');
    const viewability = allEvents.filter((e) => e.eventType === 'viewability');

    const totalImpressions = impressions.length;
    const totalClicks = clicks.length;
    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

    const avgViewTime = viewability.length > 0
      ? viewability.reduce((sum: number, e: any) => sum + (e.duration || 0), 0) / viewability.length
      : 0;

    const timeline = this.buildTimeline(allEvents, 30);

    // Screen sizes
    const screenMap: Record<string, number> = {};
    allEvents.forEach((e) => {
      if (e.screenWidth && e.screenHeight) {
        const key = `${e.screenWidth}x${e.screenHeight}`;
        screenMap[key] = (screenMap[key] || 0) + 1;
      }
    });
    const screens = Object.entries(screenMap)
      .map(([resolution, count]) => ({ resolution, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Top pages
    const pageMap: Record<string, number> = {};
    allEvents.forEach((e) => {
      const page = e.pageUrl || 'Unknown';
      pageMap[page] = (pageMap[page] || 0) + 1;
    });
    const topPages = Object.entries(pageMap)
      .map(([page, count]) => ({ page, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      adId,
      totalImpressions,
      totalClicks,
      ctr: Math.round(ctr * 100) / 100,
      avgViewTime: Math.round(avgViewTime),
      viewabilityRate: totalImpressions > 0
        ? Math.round((viewability.length / totalImpressions) * 100)
        : 0,
      timeline,
      screens,
      topPages,
      totalEvents: allEvents.length,
    };
  }

  private buildTimeline(events: any[], days: number) {
    const now = new Date();
    const timeline: { date: string; impressions: number; clicks: number; viewability: number }[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayEvents = events.filter((e) => {
        const eDate = (e.timestamp || e._created_at || '').split('T')[0];
        return eDate === dateStr;
      });

      timeline.push({
        date: dateStr,
        impressions: dayEvents.filter((e: any) => e.eventType === 'impression').length,
        clicks: dayEvents.filter((e: any) => e.eventType === 'click').length,
        viewability: dayEvents.filter((e: any) => e.eventType === 'viewability').length,
      });
    }

    return timeline;
  }
}
