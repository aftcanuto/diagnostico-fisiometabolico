import { cn } from '@/lib/cn';
import { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, forwardRef } from 'react';

export const Label = ({ className, ...p }: React.LabelHTMLAttributes<HTMLLabelElement>) => (
  <label className={cn('block text-sm font-medium text-slate-700 mb-1.5', className)} {...p} />
);

const base = 'w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 shadow-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200 disabled:bg-slate-50';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...p }, ref) => <input ref={ref} className={cn(base, className)} {...p} />
);
Input.displayName = 'Input';

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...p }, ref) => <select ref={ref} className={cn(base, 'appearance-none pr-8', className)} {...p} />
);
Select.displayName = 'Select';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...p }, ref) => (
    <textarea ref={ref} className={cn(base, 'h-auto min-h-[88px] py-2', className)} {...p} />
  )
);
Textarea.displayName = 'Textarea';

export const Field = ({ label, children, hint, error }: {
  label: string; children: React.ReactNode; hint?: string; error?: string;
}) => (
  <div>
    <Label>{label}</Label>
    {children}
    {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
  </div>
);
