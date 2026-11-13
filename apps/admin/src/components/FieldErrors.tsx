import type { ZodError } from 'zod';

export const issuesToMap = (e: ZodError) =>
  Object.fromEntries(e.issues.map((i) => [i.path.join('.') || 'form', i.message])) as Record<string, string>;

export function FieldError({ errors, name }: { errors: Record<string, string>; name: string }) {
  return errors[name] ? <p className="text-xs text-destructive">{errors[name]}</p> : null;
}
