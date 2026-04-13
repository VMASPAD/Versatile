import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from 'gnome-ui/card';

const COLORS = [
  'oklch(0.61 0.18 35)',   // orange
  'oklch(0.45 0.12 330)',  // purple
  'oklch(0.55 0.12 250)',  // blue
  'oklch(0.7 0.15 80)',    // green
  'oklch(0.75 0.15 50)',   // yellow
];

interface BarChartProps {
  title: string;
  data: any[];
  dataKey: string;
  nameKey?: string;
  color?: string;
  showMultiColor?: boolean;
}

export function BarChartCard({
  title,
  data,
  dataKey,
  nameKey = 'name',
  color = 'oklch(0.61 0.18 35)',
  showMultiColor = false,
}: BarChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsBarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border)"
                opacity={0.5}
                vertical={false}
              />
              <XAxis
                dataKey={nameKey}
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                tickLine={false}
                axisLine={{ stroke: 'var(--border)' }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '0.75rem',
                  fontSize: '12px',
                  color: 'var(--foreground)',
                }}
                cursor={{ fill: 'var(--accent)', opacity: 0.3 }}
              />
              <Bar
                dataKey={dataKey}
                radius={[6, 6, 0, 0]}
                animationDuration={1000}
                animationEasing="ease-out"
              >
                {showMultiColor
                  ? data.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))
                  : data.map((_, i) => (
                      <Cell key={i} fill={color} />
                    ))
                }
              </Bar>
            </RechartsBarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
