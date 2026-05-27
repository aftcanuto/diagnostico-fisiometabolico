'use client';

import type { ReactNode } from 'react';

export function PrintButton({ children }: { children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
    >
      {children}
    </button>
  );
}
