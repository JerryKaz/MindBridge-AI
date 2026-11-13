import {
  SUPPORT_CATEGORIES,
  VERIFICATION_STATUSES,
  supportResourceSchema,
  type SupportResource,
  type SupportResourceInput,
  type University,
} from '@mindbridge/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ShieldAlert } from 'lucide-react';
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

type FormState = Record<
  'name' | 'category' | 'description' | 'universityId' | 'phone' | 'email' | 'website' | 'location' | 'region' | 'availability' | 'verificationStatus' | 'verificationSource',
  string
> & { isFree: boolean; published: boolean };

const fromResource = (r: SupportResource | null): FormState => ({
  name: r?.name ?? '',
  category: r?.category ?? 'UNIVERSITY_COUNSELLING',
  description: r?.description ?? '',
  universityId: r?.university?.id ?? '',
  phone: r?.phone ?? '',
  email: r?.email ?? '',
  website: r?.website ?? '',
  location: r?.location ?? '',
  region: r?.region ?? '',
  availability: r?.availability ?? '',
  verificationStatus: r?.verificationStatus ?? 'PENDING',
  verificationSource: '',
  isFree: r?.isFree ?? false,
  published: r?.published ?? false,
});

/** Empty strings become "not provided" so optional validators are skipped. */
const toInput = (f: FormState) => {
  const opt = (v: string) => (v.trim() ? v.trim() : undefined);
  return {
    name: f.name,
    category: f.category,
    description: f.description,
    universityId: f.universityId || null,
    phone: opt(f.phone),
    email: opt(f.email),
    website: opt(f.website),
    location: opt(f.location),
    region: opt(f.region),
    availability: opt(f.availability),
    isFree: f.isFree,
    verificationStatus: f.verificationStatus,
    verificationSource: opt(f.verificationSource),
    published: f.published,
  };
};

function ResourceForm({ initial, onDone }: { initial: SupportResource | null; onDone: () => void }) {
  const qc = useQueryClient();
  const universities = useQuery({ queryKey: ['universities'], queryFn: () => api<University[]>('/universities') });
  const [f, setF] = useState<FormState>(fromResource(initial));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const save = useMutation({
    mutationFn: (body: SupportResourceInput) =>
      initial
        ? api<SupportResource>(`/admin/support-resources/${initial.id}`, { method: 'PUT', body })
        : api<SupportResource>('/admin/support-resources', { method: 'POST', body }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin-support'] });
      onDone();
    },
  });
  const set = (k: keyof FormState, v: string | boolean) => setF((s) => ({ ...s, [k]: v }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const parsed = supportResourceSchema.safeParse(toInput(f));
    if (!parsed.success) return setErrors(issuesToMap(parsed.error));
    setErrors({});
    save.mutate(parsed.data);
  };

  const text = (k: keyof FormState, label: string, props: Record<string, unknown> = {}) => (
    <div className="grid gap-2">
      <Label htmlFor={k}>{label}</Label>
      <Input id={k} value={f[k] as string} onChange={(e) => set(k, e.target.value)} {...props} />
      <FieldError errors={errors} name={k} />
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initial ? 'Edit resource' : 'Add resource'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
          <div className="flex gap-2 rounded-md bg-amber-50 p-3 text-sm text-amber-900 md:col-span-2">
            <ShieldAlert className="size-4 shrink-0" />
            Only enter details you have confirmed with the service itself or its official website. Never guess phone numbers.
            Students only see resources that are marked Verified and Published.
          </div>
          {save.error && <div className="md:col-span-2"><ErrorBox message={save.error.message} /></div>}
          {text('name', 'Name')}
          <div className="grid gap-2">
            <Label htmlFor="category">Category</Label>
            <Select id="category" value={f.category} onChange={(e) => set('category', e.target.value)}>
              {SUPPORT_CATEGORIES.map((c) => <option key={c} value={c}>{pretty(c)}</option>)}
            </Select>
          </div>
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="description">Service description</Label>
            <Textarea id="description" value={f.description} onChange={(e) => set('description', e.target.value)} />
            <FieldError errors={errors} name="description" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="universityId">University (blank = available to all)</Label>
            <Select id="universityId" value={f.universityId} onChange={(e) => set('universityId', e.target.value)}>
              <option value="">— National / all students —</option>
              {universities.data?.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </Select>
          </div>
          {text('phone', 'Phone')}
          {text('email', 'Email', { type: 'email' })}
          {text('website', 'Website', { placeholder: 'https://' })}
          {text('location', 'Location / address')}
          {text('region', 'Region')}
          {text('availability', 'Availability (as confirmed)')}
          <Label className="self-end pb-2">
            <input type="checkbox" checked={f.isFree} onChange={(e) => set('isFree', e.target.checked)} /> Free for students
          </Label>
          <div className="grid gap-2">
            <Label htmlFor="verificationStatus">Verification status</Label>
            <Select id="verificationStatus" value={f.verificationStatus} onChange={(e) => set('verificationStatus', e.target.value)}>
              {VERIFICATION_STATUSES.map((s) => <option key={s} value={s}>{pretty(s)}</option>)}
            </Select>
          </div>
          {text('verificationSource', 'How was it verified? (required to verify)', { placeholder: 'e.g. Called the unit on 12 Nov 2026; confirmed on official site' })}
          <Label className="md:col-span-2">
            <input type="checkbox" checked={f.published} onChange={(e) => set('published', e.target.checked)} /> Published to students (requires Verified)
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

const statusVariant = (s: SupportResource['verificationStatus']) =>
  s === 'VERIFIED' ? 'secondary' : s === 'PENDING' ? 'warning' : 'destructive';

export function SupportPage() {
  const [editing, setEditing] = useState<SupportResource | null | 'new'>(null);
  const q = useQuery({ queryKey: ['admin-support'], queryFn: () => api<SupportResource[]>('/admin/support-resources') });

  return (
    <>
      <PageHeader
        title="Support resources"
        description="Verified human support shown to students and in the AI safety pathway."
        actions={!editing && <Button onClick={() => setEditing('new')}>Add resource</Button>}
      />
      {editing && (
        <div className="mb-6">
          <ResourceForm key={editing === 'new' ? 'new' : editing.id} initial={editing === 'new' ? null : editing} onDone={() => setEditing(null)} />
        </div>
      )}
      <Card>
        <CardContent>
          {q.isPending ? (
            <Loading />
          ) : q.error ? (
            <ErrorBox message={q.error.message} />
          ) : q.data.length === 0 ? (
            <Empty>No resources yet. Add your university counselling units and verified emergency contacts first.</Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>University</TableHead>
                  <TableHead>Verification</TableHead>
                  <TableHead>Visible</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {q.data.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell>{pretty(r.category)}</TableCell>
                    <TableCell>{r.university?.name ?? 'All'}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(r.verificationStatus)}>{pretty(r.verificationStatus)}</Badge>
                      {r.verifiedAt && <div className="mt-1 text-xs text-muted-foreground">{new Date(r.verifiedAt).toLocaleDateString()}</div>}
                    </TableCell>
                    <TableCell>{r.published ? 'Yes' : 'No'}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => setEditing(r)}>Edit</Button>
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
