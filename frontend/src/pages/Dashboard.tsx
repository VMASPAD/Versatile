import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { StatsCard } from '../components/StatsCard';
import { AreaChartCard } from '../components/charts/AreaChart';
import { BarChartCard } from '../components/charts/BarChart';
import { PieChartCard } from '../components/charts/PieChart';
import { Eye, MousePointerClick, Timer, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from 'gnome-ui/card';

interface OverviewData {
  totalImpressions: number;
  totalClicks: number;
  ctr: number;
  avgViewTime: number;
  avgViewport: number;
  viewabilityRate: number;
  timeline: { date: string; impressions: number; clicks: number; viewability: number }[];
  topReferrers: { referrer: string; count: number }[];
  devices: { device: string; count: number }[];
  hourly: { hour: number; impressions: number; clicks: number }[];
  totalEvents: number;
}

export default function Dashboard() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getOverview().catch(() => null),
      api.getAds().catch(() => []),
    ]).then(([overview, adsList]) => {
      setData(overview);
      setAds(adsList);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const overview = data || {
    totalImpressions: 0,
    totalClicks: 0,
    ctr: 0,
    avgViewTime: 0,
    viewabilityRate: 0,
    timeline: [],
    topReferrers: [],
    devices: [],
    hourly: [],
    totalEvents: 0,
    avgViewport: 0,
  };

  const deviceData = overview.devices.map((d) => ({
    name: d.device,
    value: d.count,
  }));

  const hourlyData = overview.hourly.map((h) => ({
    hour: `${h.hour}:00`,
    impressions: h.impressions,
    clicks: h.clicks,
  }));

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Overview of your ad performance
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Impressions"
          value={overview.totalImpressions}
          icon={<Eye className="h-5 w-5" />}
        />
        <StatsCard
          title="Total Clicks"
          value={overview.totalClicks}
          icon={<MousePointerClick className="h-5 w-5" />}
        />
        <StatsCard
          title="Click-Through Rate"
          value={`${overview.ctr}%`}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <StatsCard
          title="Avg. View Time"
          value={`${(overview.avgViewTime / 1000).toFixed(1)}s`}
          subtitle={`${overview.viewabilityRate}% viewability`}
          icon={<Timer className="h-5 w-5" />}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AreaChartCard
          title="Impressions & Clicks (Last 30 days)"
          data={overview.timeline}
          dataKeys={[
            { key: 'impressions', color: 'oklch(0.61 0.18 35)', label: 'Impressions' },
            { key: 'clicks', color: 'oklch(0.55 0.12 250)', label: 'Clicks' },
          ]}
        />
        <BarChartCard
          title="Hourly Distribution"
          data={hourlyData}
          dataKey="impressions"
          nameKey="hour"
          showMultiColor
        />
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <PieChartCard
          title="Devices"
          data={deviceData.length > 0 ? deviceData : [{ name: 'No data', value: 1 }]}
        />

        {/* Top Referrers */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-foreground">Top Referrers</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {overview.topReferrers.length > 0 ? (
              <div className="space-y-3">
                {overview.topReferrers.slice(0, 8).map((r, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-foreground truncate max-w-[70%]">
                          {r.referrer || 'Direct'}
                        </span>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {r.count}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary/70 transition-all duration-500"
                          style={{
                            width: `${(r.count / (overview.topReferrers[0]?.count || 1)) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No referrer data yet
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Active Ads */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-foreground">
            Active Ads ({ads.filter((a: any) => a.active).length})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {ads.length > 0 ? (
            <div className="divide-y divide-border">
              {ads.slice(0, 5).map((ad: any) => (
                <div key={ad._id} className="flex items-center gap-4 py-3">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      ad.active ? 'bg-success' : 'bg-muted-foreground'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{ad.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {ad.type === 'image' ? 'Image banner' : 'HTML banner'} · {ad.width}×{ad.height}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {ad.impressions || 0} imp
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No ads created yet. Go to Ads to create your first one.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
