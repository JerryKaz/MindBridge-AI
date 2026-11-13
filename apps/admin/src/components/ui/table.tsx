import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

export function Table({ className, ...props }: ComponentProps<'table'>) {
  return (
    <div className="relative w-full overflow-x-auto">
      <table data-slot="table" className={cn('w-full caption-bottom text-sm', className)} {...props} />
    </div>
  );
}
export const TableHeader = ({ className, ...p }: ComponentProps<'thead'>) => <thead className={cn('[&_tr]:border-b', className)} {...p} />;
export const TableBody = ({ className, ...p }: ComponentProps<'tbody'>) => <tbody className={cn('[&_tr:last-child]:border-0', className)} {...p} />;
export const TableRow = ({ className, ...p }: ComponentProps<'tr'>) => <tr className={cn('hover:bg-muted/50 border-b transition-colors', className)} {...p} />;
export const TableHead = ({ className, ...p }: ComponentProps<'th'>) => (
  <th className={cn('text-muted-foreground h-10 px-3 text-left align-middle font-medium whitespace-nowrap', className)} {...p} />
);
export const TableCell = ({ className, ...p }: ComponentProps<'td'>) => <td className={cn('p-3 align-middle', className)} {...p} />;
