'use client';
import { useEffect, useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';

export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export function SaveIndicator({ state }: { state: SaveState }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (state === 'saved') {
      setVisible(true);
      const t = setTimeout(() => setVisible(false), 1800);
      return () => clearTimeout(t);
    }
    if (state === 'saving') setVisible(true);
  }, [state]);

  if (!visible && state !== 'saving') return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-white border border-slate-200 px-4 py-2 shadow-md text-sm">
      {state === 'saving' ? (
        <><Loader2 className="w-4 h-4 animate-spin text-brand-600" /> Salvando…</>
      ) : state === 'saved' ? (
        <><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Salvo</>
      ) : state === 'error' ? (
        <span className="text-red-600">Erro ao salvar</span>
      ) : null}
    </div>
  );
}
