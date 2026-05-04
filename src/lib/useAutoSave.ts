'use client';
import { useEffect, useRef, useState } from 'react';
import type { SaveState } from '@/components/ui/SaveIndicator';

export function useAutoSave<T>(value: T, save: (v: T) => Promise<void>, delay = 1200) {
  const [state, setState] = useState<SaveState>('idle');
  const first = useRef(true);
  const timer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (timer.current) clearTimeout(timer.current);
    setState('saving');
    timer.current = setTimeout(async () => {
      try { await save(value); setState('saved'); }
      catch { setState('error'); }
    }, delay);
    return () => { if (timer.current) clearTimeout(timer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(value)]);

  return state;
}
