import type { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions}
    </div>
  );
}

export function StatCard({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <Card className="gap-2">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-3xl">{value}</CardTitle>
      </CardHeader>
      {hint && <CardContent className="text-xs text-muted-foreground">{hint}</CardContent>}
    </Card>
  );
}

export function ChartCard({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="h-64">{children}</CardContent>
    </Card>
  );
}

export const Loading = () => <div className="py-10 text-center text-sm text-muted-foreground">Loading…</div>;
export const ErrorBox = ({ message }: { message: string }) => (
  <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{message}</div>
);
export const Empty = ({ children }: { children: ReactNode }) => (
  <div className="py-10 text-center text-sm text-muted-foreground">{children}</div>
);

export const CHART_COLORS = ['#2f7d6d', '#7a6fb0', '#d08c3c', '#4f8fbf', '#b85c6e', '#6b8f3a', '#8a6d5a', '#3c9aa0', '#a37bc7'];
