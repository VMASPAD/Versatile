import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { api } from '../lib/api';
import { StatsCard } from '../components/StatsCard';
import { LineChartCard } from '../components/charts/LineChart';
import { BarChartCard } from '../components/charts/BarChart';
import { AreaChartCard } from '../components/charts/AreaChart';
import { PieChartCard } from '../components/charts/PieChart';
import { Card, CardContent, CardHeader, CardTitle } from 'gnome-ui/card';
import { Eye, MousePointerClick, TrendingUp, Timer, ArrowLeft } from 'lucide-react';

export default function Analytics() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = id
      ? api.getAdAnalytics(id)
      : api.getOverview();

    fetch
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const d = data || {
    totalImpressions: 0,
    totalClicks: 0,
    ctr: 0,
    avgViewTime: 0,
    viewabilityRate: 0,
    timeline: [],
    topReferrers: [],
    devices: [],
    hourly: [],
    screens: [],
    topPages: [],
    totalEvents: 0,
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        {id && (
          <button onClick={() => navigate('/analytics')} className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {id ? 'Ad Analytics' : 'Analytics Overview'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {id ? `Detailed metrics for ad ${id.slice(0, 8)}...` : 'Global performance metrics'}
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Impressions"
          value={d.totalImpressions}
          icon={<Eye className="h-5 w-5" />}
        />
        <StatsCard
          title="Clicks"
          value={d.totalClicks}
          icon={<MousePointerClick className="h-5 w-5" />}
        />
        <StatsCard
          title="CTR"
          value={`${d.ctr}%`}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <StatsCard
          title="Viewability"
          value={`${d.viewabilityRate}%`}
          subtitle={`Avg. ${(d.avgViewTime / 1000).toFixed(1)}s view time`}
          icon={<Timer className="h-5 w-5" />}
        />
      </div>

      {/* Timeline */}
      <LineChartCard
        title="Events Timeline (30 days)"
        data={d.timeline || []}
        dataKeys={[
          { key: 'impressions', color: 'oklch(0.61 0.18 35)', label: 'Impressions' },
          { key: 'clicks', color: 'oklch(0.55 0.12 250)', label: 'Clicks' },
          { key: 'viewability', color: 'oklch(0.7 0.15 80)', label: 'Viewability' },
        ]}
      />

      {/* Detail charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AreaChartCard
          title="Impressions vs Clicks"
          data={d.timeline || []}
          dataKeys={[
            { key: 'impressions', color: 'oklch(0.61 0.18 35)', label: 'Impressions' },
            { key: 'clicks', color: 'oklch(0.45 0.12 330)', label: 'Clicks' },
          ]}
        />

        {d.devices ? (
          <PieChartCard
            title="Devices"
            data={(d.devices || []).map((dv: any) => ({
              name: dv.device,
              value: dv.count,
            }))}
          />
        ) : d.screens ? (
          <BarChartCard
            title="Screen Resolutions"
            data={(d.screens || []).map((s: any) => ({
              name: s.resolution,
              count: s.count,
            }))}
            dataKey="count"
            showMultiColor
          />
        ) : null}
      </div>

      {/* Hourly + Referrers / Pages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {d.hourly && (
          <BarChartCard
            title="Hourly Distribution"
            data={(d.hourly || []).map((h: any) => ({
              name: `${h.hour}:00`,
              impressions: h.impressions,
            }))}
            dataKey="impressions"
            showMultiColor
          />
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-foreground">
              {id ? 'Top Pages' : 'Top Referrers'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {(id ? d.topPages : d.topReferrers)?.length > 0 ? (
              <div className="space-y-3">
                {(id ? d.topPages : d.topReferrers).slice(0, 8).map((item: any, i: number) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs font-mono text-muted-foreground w-5">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground truncate">
                        {item.page || item.referrer || 'Direct'}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Total events */}
      <div className="text-xs text-muted-foreground text-center">
        Total events recorded: {d.totalEvents.toLocaleString()}
      </div>
    </div>
  );
}
