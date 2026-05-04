import { cn } from '@/lib/cn';
import { HTMLAttributes } from 'react';

export const Card = ({ className, ...p }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('rounded-xl border border-slate-200 bg-white shadow-sm', className)} {...p} />
);
export const CardHeader = ({ className, ...p }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('p-5 border-b border-slate-100', className)} {...p} />
);
export const CardTitle = ({ className, ...p }: HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={cn('text-base font-semibold text-slate-800', className)} {...p} />
);
export const CardBody = ({ className, ...p }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('p-5', className)} {...p} />
);
