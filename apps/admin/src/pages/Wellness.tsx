import {
  CONTENT_REVIEW_STATUSES,
  WELLNESS_CATEGORIES,
  wellnessActivitySchema,
  type WellnessActivity,
  type WellnessActivityInput,
} from '@mindbridge/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { Empty, ErrorBox, Loading, PageHeader } from '@/components/common';
import { FieldError, issuesToMap } from '@/components/FieldErrors';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input, Select, Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { api } from '@/lib/api';
import { pretty } from '@/lib/utils';

const EMPTY: WellnessActivityInput = {
  title: '',
  description: '',
  category: 'BREATHING',
  durationMinutes: 5,
  instructions: [],
  reviewStatus: 'DRAFT',
  published: false,
};

function ActivityForm({ initial, onDone }: { initial: WellnessActivity | null; onDone: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<WellnessActivityInput>(
    initial ? { ...initial, reviewedBy: initial.reviewedBy ?? undefined } : EMPTY,
  );
  const [steps, setSteps] = useState((initial?.instructions ?? []).join('\n'));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const save = useMutation({
    mutationFn: (body: WellnessActivityInput) =>
      initial
        ? api<WellnessActivity>(`/admin/wellness-activities/${initial.id}`, { method: 'PUT', body })
        : api<WellnessActivity>('/admin/wellness-activities', { method: 'POST', body }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin-wellness'] });
      onDone();
    },
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const parsed = wellnessActivitySchema.safeParse({ ...form, instructions: steps.split('\n').map((s) => s.trim()).filter(Boolean) });
    if (!parsed.success) return setErrors(issuesToMap(parsed.error));
    setErrors({});
    save.mutate(parsed.data);
  };
  const set = <K extends keyof WellnessActivityInput>(k: K, v: WellnessActivityInput[K]) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initial ? 'Edit activity' : 'New activity'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
          {save.error && <div className="md:col-span-2"><ErrorBox message={save.error.message} /></div>}
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={form.title} onChange={(e) => set('title', e.target.value)} />
            <FieldError errors={errors} name="title" />
          </div>
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={form.description} onChange={(e) => set('description', e.target.value)} />
            <FieldError errors={errors} name="description" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="category">Category</Label>
            <Select id="category" value={form.category} onChange={(e) => set('category', e.target.value as WellnessActivityInput['category'])}>
              {WELLNESS_CATEGORIES.map((c) => (
                <option key={c} value={c}>{pretty(c)}</option>
              ))}
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Input id="duration" type="number" min={1} max={120} value={form.durationMinutes} onChange={(e) => set('durationMinutes', Number(e.target.value))} />
            <FieldError errors={errors} name="durationMinutes" />
          </div>
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="steps">Instructions (one step per line)</Label>
            <Textarea id="steps" rows={6} value={steps} onChange={(e) => setSteps(e.target.value)} />
            <FieldError errors={errors} name="instructions" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="review">Professional review</Label>
            <Select id="review" value={form.reviewStatus} onChange={(e) => set('reviewStatus', e.target.value as WellnessActivityInput['reviewStatus'])}>
              {CONTENT_REVIEW_STATUSES.map((s) => (
                <option key={s} value={s}>{pretty(s)}</option>
              ))}
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="reviewedBy">Reviewed by (name, credentials)</Label>
            <Input id="reviewedBy" value={form.reviewedBy ?? ''} onChange={(e) => set('reviewedBy', e.target.value || undefined)} />
          </div>
          <Label className="md:col-span-2">
            <input type="checkbox" checked={form.published} onChange={(e) => set('published', e.target.checked)} /> Published to students
          </Label>
          <div className="flex gap-2 md:col-span-2">
            <Button type="submit" disabled={save.isPending}>{save.isPending ? 'Saving…' : 'Save'}</Button>
            <Button type="button" variant="ghost" onClick={onDone}>Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function WellnessPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<WellnessActivity | null | 'new'>(null);
  const q = useQuery({ queryKey: ['admin-wellness'], queryFn: () => api<WellnessActivity[]>('/admin/wellness-activities') });
  const toggle = useMutation({
    mutationFn: (a: WellnessActivity) => api(`/admin/wellness-activities/${a.id}`, { method: 'PUT', body: { published: !a.published } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-wellness'] }),
  });

  return (
    <>
      <PageHeader
        title="Wellness content"
        description="Create, edit and publish guided activities. Prefer professionally reviewed content."
        actions={!editing && <Button onClick={() => setEditing('new')}>New activity</Button>}
      />
      {editing && (
        <div className="mb-6">
          <ActivityForm key={editing === 'new' ? 'new' : editing.id} initial={editing === 'new' ? null : editing} onDone={() => setEditing(null)} />
        </div>
      )}
      <Card>
        <CardContent>
          {q.isPending ? (
            <Loading />
          ) : q.error ? (
            <ErrorBox message={q.error.message} />
          ) : q.data.length === 0 ? (
            <Empty>No activities yet. Run the seed script or create one.</Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Review</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {q.data.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.title}</TableCell>
                    <TableCell>{pretty(a.category)}</TableCell>
                    <TableCell>{a.durationMinutes} min</TableCell>
                    <TableCell>
                      <Badge variant={a.reviewStatus === 'PROFESSIONALLY_REVIEWED' ? 'secondary' : 'warning'}>{pretty(a.reviewStatus)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={a.published ? 'default' : 'outline'}>{a.published ? 'Published' : 'Draft'}</Badge>
                    </TableCell>
                    <TableCell className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => setEditing(a)}>Edit</Button>
                      <Button size="sm" variant="ghost" disabled={toggle.isPending} onClick={() => toggle.mutate(a)}>
                        {a.published ? 'Unpublish' : 'Publish'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
