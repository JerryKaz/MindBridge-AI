import type { AuditLogEntry, Paginated } from '@mindbridge/shared';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Empty, ErrorBox, Loading, PageHeader } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { api } from '@/lib/api';
import { pretty } from '@/lib/utils';

export function AuditLogPage() {
  const [page, setPage] = useState(1);
  const q = useQuery({
    queryKey: ['audit', page],
    queryFn: () => api<Paginated<AuditLogEntry>>(`/admin/audit-logs?page=${page}&pageSize=50`),
    placeholderData: keepPreviousData,
  });
  return (
    <>
      <PageHeader title="Audit log" description="Sensitive administrative and privacy actions, newest first." />
      <Card>
        <CardContent className="flex flex-col gap-4">
          {q.isPending ? (
            <Loading />
          ) : q.error ? (
            <ErrorBox message={q.error.message} />
          ) : q.data.items.length === 0 ? (
            <Empty>No audited actions yet.</Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {q.data.items.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="whitespace-nowrap">{new Date(e.createdAt).toLocaleString()}</TableCell>
                    <TableCell>{e.actor?.email ?? 'System / self-service'}</TableCell>
                    <TableCell>{pretty(e.action)}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {e.targetType}
                      {e.targetId ? ` · ${e.targetId}` : ''}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{Object.keys(e.metadata).length ? JSON.stringify(e.metadata) : '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              Previous
            </Button>
            <Button size="sm" variant="outline" disabled={!q.data || page * q.data.pageSize >= q.data.total} onClick={() => setPage(page + 1)}>
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
