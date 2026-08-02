'use client';

import { useState } from 'react';

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
      <div className="rounded-3xl border border-[#1D9E75]/15 bg-[#E8F7F1] p-8 text-center">
        <h2 className="font-serif text-2xl font-semibold tracking-[-0.035em] text-[#155C47]">Anamnese enviada</h2>
        <p className="mt-2 text-sm text-[#155C47]">Suas respostas foram registradas com segurança para o avaliador.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {erro && <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</div>}
      {campos.map(c => (
        <div key={c.id}>
          {c.tipo === 'secao' ? (
            <h2 className="border-b border-[#E5DDD2] pb-2 pt-4 font-serif text-2xl font-semibold tracking-[-0.035em] text-[#0C0C0C]">{c.label}</h2>
          ) : (
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-[#334155]">
                {c.label} {c.obrigatorio && <span className="text-red-500">*</span>}
              </span>
              {renderCampo(c, respostas[c.id], valor => setRespostas(r => ({ ...r, [c.id]: valor })))}
            </label>
          )}
        </div>
      ))}
      <div className="flex justify-end border-t border-[#E5DDD2] pt-5">
        <button type="button" onClick={enviar} disabled={enviando} className="inline-flex rounded-full bg-[#1D9E75] px-6 py-3 text-sm font-bold text-white shadow-[0_14px_26px_rgba(29,158,117,0.22)] disabled:opacity-60">
          {enviando ? 'Enviando...' : 'Enviar anamnese'}
        </button>
      </div>
    </div>
  );
}

function renderCampo(c: any, value: any, onChange: (v: any) => void) {
  const base = 'w-full rounded-2xl border border-[#E5DDD2] bg-white px-3 text-sm text-[#0C0C0C] shadow-sm outline-none focus:border-[#1D9E75] focus:ring-2 focus:ring-[#E8F7F1]';
  if (c.tipo === 'texto_longo') {
    return <textarea className={`${base} min-h-[110px] py-2`} value={value ?? ''} onChange={e => onChange(e.target.value)} />;
  }
  if (c.tipo === 'boolean') {
    return (
      <select className={`${base} h-11`} value={value ?? ''} onChange={e => onChange(e.target.value)}>
        <option value="">Selecione</option>
        <option value="sim">Sim</option>
        <option value="nao">Não</option>
      </select>
    );
  }
  if (c.tipo === 'selecao') {
    return (
      <select className={`${base} h-11`} value={value ?? ''} onChange={e => onChange(e.target.value)}>
        <option value="">Selecione</option>
        {(c.opcoes ?? []).map((op: string) => <option key={op} value={op}>{op}</option>)}
      </select>
    );
  }
  if (c.tipo === 'escala') {
    return <input className={`${base} h-11`} type="number" min={1} max={10} value={value ?? ''} onChange={e => onChange(e.target.value)} />;
  }
  return (
    <div className="flex items-center gap-2">
      <input className={`${base} h-11`} type={c.tipo === 'data' ? 'date' : c.tipo === 'numero' ? 'number' : 'text'} value={value ?? ''} onChange={e => onChange(e.target.value)} />
      {c.unidade && <span className="text-xs text-[#5A5A5A]">{c.unidade}</span>}
    </div>
  );
}
