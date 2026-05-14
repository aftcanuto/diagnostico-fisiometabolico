'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

type ComprovanteAceite = {
  aceito_em?: string | null;
  ip?: string | null;
  user_agent?: string | null;
  modelo_nome?: string | null;
  texto_versao?: number | null;
};

function dataHora(valor?: string | null) {
  if (!valor) return 'Registro indisponivel';
  return new Date(valor).toLocaleString('pt-BR');
}

export function PublicConsentimentoAccept({ token, aceiteInicial }: { token: string; aceiteInicial?: ComprovanteAceite | null }) {
  const [aceito, setAceito] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [concluido, setConcluido] = useState(!!aceiteInicial);
  const [comprovante, setComprovante] = useState<ComprovanteAceite | null>(aceiteInicial ?? null);
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
      if (res.status === 409 && body.aceite) {
        setComprovante(body.aceite);
        setConcluido(true);
        return;
      }
      setErro(body.error ?? 'Nao foi possivel registrar o aceite.');
      return;
    }
    setComprovante(body.aceite ?? null);
    setConcluido(true);
  }

  if (concluido) {
    return (
      <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-6">
        <h2 className="text-xl font-bold text-emerald-900">Termo aceito</h2>
        <p className="mt-2 text-sm text-emerald-800">Este comprovante registra o aceite digital do termo.</p>
        <div className="mt-5 grid gap-3 rounded-xl border border-emerald-100 bg-white/70 p-4 text-sm text-emerald-900 md:grid-cols-2">
          <div><span className="block text-xs font-semibold uppercase tracking-wide text-emerald-600">Data e hora</span>{dataHora(comprovante?.aceito_em)}</div>
          <div><span className="block text-xs font-semibold uppercase tracking-wide text-emerald-600">Versao do termo</span>{comprovante?.texto_versao ?? '-'}</div>
          <div><span className="block text-xs font-semibold uppercase tracking-wide text-emerald-600">IP registrado</span>{comprovante?.ip ?? 'Nao registrado'}</div>
          <div><span className="block text-xs font-semibold uppercase tracking-wide text-emerald-600">Token</span><span className="font-mono text-xs">{token}</span></div>
          <div className="md:col-span-2"><span className="block text-xs font-semibold uppercase tracking-wide text-emerald-600">Dispositivo/navegador</span>{comprovante?.user_agent ?? 'Nao registrado'}</div>
        </div>
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
