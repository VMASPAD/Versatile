import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from 'gnome-ui/card';

const COLORS = [
  'oklch(0.61 0.18 35)',   // orange
  'oklch(0.45 0.12 330)',  // purple
  'oklch(0.55 0.12 250)',  // blue
  'oklch(0.7 0.15 80)',    // green
  'oklch(0.75 0.15 50)',   // yellow
  'oklch(0.6 0.1 200)',    // teal
];

interface PieChartProps {
  title: string;
  data: { name: string; value: number }[];
}

export function PieChartCard({ title, data }: PieChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
                nameKey="name"
                animationDuration={1000}
                animationEasing="ease-out"
                stroke="none"
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '0.75rem',
                  fontSize: '12px',
                  color: 'var(--foreground)',
                }}
              />
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                iconSize={8}
                wrapperStyle={{
                  fontSize: '11px',
                  color: 'var(--muted-foreground)',
                }}
              />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
