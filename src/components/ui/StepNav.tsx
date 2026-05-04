'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CheckCircle2, Circle, Lock } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface Step {
  key: string;
  label: string;
  href: string;
  enabled: boolean;
  done?: boolean;
}

export function StepNav({ steps }: { steps: Step[] }) {
  const path = usePathname();
  return (
    <nav className="w-full overflow-x-auto">
      <ol className="flex gap-2 min-w-max">
        {steps.map((s, i) => {
          const active = path?.endsWith('/' + s.key);
          const Icon = !s.enabled ? Lock : s.done ? CheckCircle2 : Circle;
          return (
            <li key={s.key} className="flex items-center gap-2">
              {s.enabled ? (
                <Link
                  href={s.href}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-3 py-2 text-sm border transition',
                    active
                      ? 'bg-brand-50 border-brand-200 text-brand-700 font-medium'
                      : s.done
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                  )}
                >
                  <Icon className={cn('w-4 h-4', s.done && 'text-emerald-600')} />
                  <span className="text-xs text-slate-400">{String(i + 1).padStart(2, '0')}</span>
                  <span>{s.label}</span>
                  {s.done && <span className="text-[10px] font-semibold text-emerald-700 bg-white/70 border border-emerald-200 rounded-full px-1.5 py-0.5">Feito</span>}
                </Link>
              ) : (
                <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm border border-dashed border-slate-200 text-slate-400">
                  <Icon className="w-4 h-4" />
                  <span className="text-xs">{String(i + 1).padStart(2, '0')}</span>
                  <span>{s.label}</span>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
