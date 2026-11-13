import { MOOD_LABELS } from '@mindbridge/shared';
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CHART_COLORS, ChartCard, ErrorBox, Loading, PageHeader, StatCard } from '@/components/common';
import { useAnalytics } from '@/lib/queries';

export function OverviewPage() {
  const { data, isPending, error } = useAnalytics();
  if (isPending) return <Loading />;
  if (error) return <ErrorBox message={error.message} />;
  const t = data.totals;
  return (
    <>
      <PageHeader title="Overview" description={`Aggregated platform activity · updated ${new Date(data.generatedAt).toLocaleTimeString()}`} />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Registered students" value={t.students} />
        <StatCard label="Active (7 days)" value={t.activeLast7Days} hint={`${t.activeLast30Days} in the last 30 days`} />
        <StatCard label="Mood check-ins" value={t.moodCheckIns} />
        <StatCard label="Conversations" value={t.conversations} />
        <StatCard label="Published wellness activities" value={t.wellnessActivitiesPublished} />
        <StatCard label="Verified support resources" value={t.verifiedSupportResources} />
        <StatCard label="AI replies (30 days)" value={data.aiPerformance.interactions} hint={`avg ${data.aiPerformance.avgLatencyMs} ms`} />
        <StatCard label="Safe-fallback rate" value={`${(data.aiPerformance.fallbackRate * 100).toFixed(1)}%`} hint="Replies replaced after validation" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Daily check-ins" description="Last 30 days">
          <ResponsiveContainer>
            <LineChart data={data.checkInsByDay}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tickFormatter={(d: string) => d.slice(5)} fontSize={12} />
              <YAxis allowDecimals={false} fontSize={12} />
              <Tooltip />
              <Line type="monotone" dataKey="count" name="Check-ins" stroke={CHART_COLORS[0]} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Mood distribution" description={`Last 30 days · groups under ${data.minCohortSize} hidden`}>
          <ResponsiveContainer>
            <BarChart data={data.moodDistribution.map((m) => ({ name: MOOD_LABELS[m.mood].label, count: m.count }))}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" fontSize={12} />
              <YAxis allowDecimals={false} fontSize={12} />
              <Tooltip />
              <Bar dataKey="count" name="Check-ins" radius={[4, 4, 0, 0]}>
                {data.moodDistribution.map((m, i) => (
                  <Cell key={m.mood} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </>
  );
}
