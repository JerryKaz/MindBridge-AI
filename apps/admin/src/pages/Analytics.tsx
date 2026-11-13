import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CHART_COLORS, ChartCard, ErrorBox, Loading, PageHeader, StatCard } from '@/components/common';
import { useAnalytics } from '@/lib/queries';

export function AnalyticsPage() {
  const { data, isPending, error } = useAnalytics();
  if (isPending) return <Loading />;
  if (error) return <ErrorBox message={error.message} />;
  const p = data.aiPerformance;
  return (
    <>
      <PageHeader
        title="Analytics"
        description={`De-identified, aggregate statistics only. Categories with fewer than ${data.minCohortSize} students are suppressed.`}
      />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="AI replies (30 days)" value={p.interactions} />
        <StatCard label="Average latency" value={`${p.avgLatencyMs} ms`} />
        <StatCard label="p95 latency" value={`${p.p95LatencyMs} ms`} />
        <StatCard label="Safe-fallback rate" value={`${(p.fallbackRate * 100).toFixed(1)}%`} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Student messages per day" description="Last 30 days">
          <ResponsiveContainer>
            <LineChart data={data.messagesByDay}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tickFormatter={(d: string) => d.slice(5)} fontSize={12} />
              <YAxis allowDecimals={false} fontSize={12} />
              <Tooltip />
              <Line type="monotone" dataKey="count" name="Messages" stroke={CHART_COLORS[1]} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Safety pathway activations" description="Weekly counts, last 12 weeks — no individual details">
          <ResponsiveContainer>
            <BarChart data={data.safetyLevelsByWeek}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="week" fontSize={12} />
              <YAxis allowDecimals={false} fontSize={12} />
              <Tooltip />
              <Legend />
              <Bar dataKey="elevated" name="Elevated concern" stackId="s" fill={CHART_COLORS[2]} />
              <Bar dataKey="immediate" name="Potential immediate danger" stackId="s" fill={CHART_COLORS[4]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Students by university" description="Self-reported, optional">
          <ResponsiveContainer>
            <BarChart data={data.registrationsByUniversity} layout="vertical" margin={{ left: 24 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" allowDecimals={false} fontSize={12} />
              <YAxis type="category" dataKey="university" width={100} fontSize={12} />
              <Tooltip />
              <Bar dataKey="count" name="Students" fill={CHART_COLORS[0]} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </>
  );
}
