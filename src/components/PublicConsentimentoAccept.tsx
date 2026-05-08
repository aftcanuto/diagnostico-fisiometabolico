'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

export function PublicConsentimentoAccept({ token }: { token: string }) {
  const [aceito, setAceito] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [concluido, setConcluido] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function confirmar() {
    setErro(null);
    if (!aceito) {
      setErro('Marque a confirmacao de leitura para aceitar o termo.');
      return;
    }
    setEnviando(true);
    const res = await fetch('/api/consentimento-publico', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    const body = await res.json().catch(() => ({}));
    setEnviando(false);
    if (!res.ok) {
      setErro(body.error ?? 'Nao foi possivel registrar o aceite.');
      return;
    }
    setConcluido(true);
  }

  if (concluido) {
    return (
      <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-8 text-center">
        <h2 className="text-xl font-bold text-emerald-900">Termo aceito</h2>
        <p className="mt-2 text-sm text-emerald-800">Seu aceite foi registrado com seguranca.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 border-t border-slate-100 pt-5">
      {erro && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</div>}
      <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
        <input
          type="checkbox"
          className="mt-1"
          checked={aceito}
          onChange={e => setAceito(e.target.checked)}
        />
        <span>Li o termo acima, compreendi as informacoes apresentadas e confirmo meu aceite digital.</span>
      </label>
      <div className="flex justify-end">
        <Button onClick={confirmar} disabled={enviando}>
          {enviando ? 'Registrando...' : 'Aceitar termo'}
        </Button>
      </div>
    </div>
  );
}
