import type { AdminUserRow, Paginated } from '@mindbridge/shared';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Empty, ErrorBox, Loading, PageHeader } from '@/components/common';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { api } from '@/lib/api';
import { useAdminUser } from '@/lib/use-auth';
import { pretty } from '@/lib/utils';

export function StudentsPage() {
  const me = useAdminUser();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ['users', page, search],
    queryFn: () => api<Paginated<AdminUserRow>>(`/admin/users?page=${page}&pageSize=25${search ? `&search=${encodeURIComponent(search)}` : ''}`),
    placeholderData: keepPreviousData,
  });
  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'ACTIVE' | 'DEACTIVATED' }) =>
      api<void>(`/admin/users/${id}/status`, { method: 'PATCH', body: { status } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });

  const pages = q.data ? Math.max(1, Math.ceil(q.data.total / q.data.pageSize)) : 1;

  return (
    <>
      <PageHeader title="Students" description="Basic account management. Conversations, journals and mood histories are not accessible." />
      <Card>
        <CardContent className="flex flex-col gap-4">
          <Input
            placeholder="Search by email or display name"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="max-w-sm"
          />
          {setStatus.error && <ErrorBox message={setStatus.error.message} />}
          {q.isPending ? (
            <Loading />
          ) : q.error ? (
            <ErrorBox message={q.error.message} />
          ) : q.data.items.length === 0 ? (
            <Empty>No accounts found.</Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>University</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {q.data.items.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.displayName}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{u.university ?? '—'}</TableCell>
                    <TableCell>{pretty(u.role)}</TableCell>
                    <TableCell>
                      <Badge variant={u.status === 'ACTIVE' ? 'secondary' : 'destructive'}>{pretty(u.status)}</Badge>
                    </TableCell>
                    <TableCell>{new Date(u.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      {u.id !== me?.id && u.role !== 'SUPER_ADMIN' && (
                        <Button
                          size="sm"
                          variant={u.status === 'ACTIVE' ? 'outline' : 'secondary'}
                          disabled={setStatus.isPending}
                          onClick={() => {
                            const status = u.status === 'ACTIVE' ? 'DEACTIVATED' : 'ACTIVE';
                            if (status === 'ACTIVE' || confirm(`Deactivate ${u.email}? They will be signed out everywhere.`)) setStatus.mutate({ id: u.id, status });
                          }}
                        >
                          {u.status === 'ACTIVE' ? 'Deactivate' : 'Reactivate'}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <div className="flex items-center justify-end gap-2 text-sm">
            <span className="text-muted-foreground">
              Page {page} of {pages}
            </span>
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              Previous
            </Button>
            <Button size="sm" variant="outline" disabled={page >= pages} onClick={() => setPage(page + 1)}>
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
