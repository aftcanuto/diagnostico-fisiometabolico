'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

export function PublicAnamneseForm({ token, campos }: { token: string; campos: any[] }) {
  const [respostas, setRespostas] = useState<Record<string, any>>({});
  const [enviando, setEnviando] = useState(false);
  const [concluido, setConcluido] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function enviar() {
    setErro(null);
    setEnviando(true);
    const obrigatorioVazio = campos.some(c => c.tipo !== 'secao' && c.obrigatorio && !respostas[c.id]);
    if (obrigatorioVazio) {
      setErro('Preencha os campos obrigatórios antes de enviar.');
      setEnviando(false);
      return;
    }
    const res = await fetch('/api/anamnese-publica', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, respostas }),
    });
    const body = await res.json().catch(() => ({}));
    setEnviando(false);
    if (!res.ok) {
      setErro(body.error ?? 'Não foi possível enviar a anamnese.');
      return;
    }
    setConcluido(true);
  }

  if (concluido) {
    return (
      <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-8 text-center">
        <h2 className="text-xl font-bold text-emerald-900">Anamnese enviada</h2>
        <p className="mt-2 text-sm text-emerald-800">Suas respostas foram registradas com segurança para o avaliador.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {erro && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</div>}
      {campos.map(c => (
        <div key={c.id}>
          {c.tipo === 'secao' ? (
            <h2 className="border-b border-slate-200 pb-2 pt-4 text-lg font-bold text-slate-800">{c.label}</h2>
          ) : (
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                {c.label} {c.obrigatorio && <span className="text-red-500">*</span>}
              </span>
              {renderCampo(c, respostas[c.id], valor => setRespostas(r => ({ ...r, [c.id]: valor })))}
            </label>
          )}
        </div>
      ))}
      <div className="flex justify-end border-t border-slate-100 pt-5">
        <Button onClick={enviar} disabled={enviando}>
          {enviando ? 'Enviando...' : 'Enviar anamnese'}
        </Button>
      </div>
    </div>
  );
}

function renderCampo(c: any, value: any, onChange: (v: any) => void) {
  const base = 'w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 shadow-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200';
  if (c.tipo === 'texto_longo') {
    return <textarea className={`${base} min-h-[110px] py-2`} value={value ?? ''} onChange={e => onChange(e.target.value)} />;
  }
  if (c.tipo === 'boolean') {
    return (
      <select className={`${base} h-10`} value={value ?? ''} onChange={e => onChange(e.target.value)}>
        <option value="">Selecione</option>
        <option value="sim">Sim</option>
        <option value="nao">Não</option>
      </select>
    );
  }
  if (c.tipo === 'selecao') {
    return (
      <select className={`${base} h-10`} value={value ?? ''} onChange={e => onChange(e.target.value)}>
        <option value="">Selecione</option>
        {(c.opcoes ?? []).map((op: string) => <option key={op} value={op}>{op}</option>)}
      </select>
    );
  }
  if (c.tipo === 'escala') {
    return <input className={`${base} h-10`} type="number" min={1} max={10} value={value ?? ''} onChange={e => onChange(e.target.value)} />;
  }
  return (
    <div className="flex items-center gap-2">
      <input className={`${base} h-10`} type={c.tipo === 'data' ? 'date' : c.tipo === 'numero' ? 'number' : 'text'} value={value ?? ''} onChange={e => onChange(e.target.value)} />
      {c.unidade && <span className="text-xs text-slate-500">{c.unidade}</span>}
    </div>
  );
}
