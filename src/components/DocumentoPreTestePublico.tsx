'use client';

import { useState } from 'react';

export function DocumentoPreTestePublico({ token, tipo, campos = [] }: { token: string; tipo: string; campos?: any[] }) {
  const [respostas, setRespostas] = useState<Record<string, any>>({});
  const [enviando, setEnviando] = useState(false);
  const [concluido, setConcluido] = useState(false);
  const [confirmado, setConfirmado] = useState(false);
  const [erro, setErro] = useState('');

  async function enviar() {
    setEnviando(true); setErro('');
    const response = await fetch('/api/documentos-pre-teste-publico', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, respostas, aceitar: tipo === 'consentimento' ? confirmado : undefined }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) setErro(body.error ?? 'Não foi possível concluir.');
    else setConcluido(true);
    setEnviando(false);
  }

  if (concluido) return <div className="rounded-3xl border border-[#1D9E75]/15 bg-[#E8F7F1] p-6 text-center font-semibold text-[#155C47]">Documento concluído com sucesso.</div>;
  if (tipo === 'consentimento') return <div className="mt-6 space-y-4">
    <label className="flex items-start gap-3 rounded-3xl border border-[#E5DDD2] bg-[#FAF5EF] p-4 text-sm text-[#5A5A5A]">
      <input type="checkbox" className="mt-1 accent-[#1D9E75]" checked={confirmado} onChange={(e) => setConfirmado(e.target.checked)} />
      <span>Li e concordo com o conteúdo apresentado.</span>
    </label>
    <button type="button" onClick={enviar} disabled={!confirmado || enviando} className="inline-flex rounded-full bg-[#1D9E75] px-6 py-3 text-sm font-bold text-white shadow-[0_14px_26px_rgba(29,158,117,0.22)] disabled:opacity-60">
      {enviando ? 'Registrando...' : 'Confirmar aceite'}
    </button>
    {erro && <p className="text-sm text-red-600">{erro}</p>}
  </div>;

  return <div className="space-y-4">
    {campos.map((campo: any, index) => {
      const id = campo.id || campo.nome || `campo_${index}`;
      const label = campo.label || campo.nome || `Pergunta ${index + 1}`;
      if (campo.tipo === 'textarea') return <label key={id} className="block text-sm font-semibold text-[#334155]">{label}<textarea className={campoBase('min-h-24 p-3')} value={respostas[id] ?? ''} onChange={(e) => setRespostas(v => ({ ...v, [id]: e.target.value }))} /></label>;
      if (campo.tipo === 'select' && Array.isArray(campo.opcoes)) return <label key={id} className="block text-sm font-semibold text-[#334155]">{label}<select className={campoBase('h-12 px-3')} value={respostas[id] ?? ''} onChange={(e) => setRespostas(v => ({ ...v, [id]: e.target.value }))}><option value="">Selecione</option>{campo.opcoes.map((opcao: any) => <option key={String(opcao)} value={String(opcao)}>{String(opcao)}</option>)}</select></label>;
      return <label key={id} className="block text-sm font-semibold text-[#334155]">{label}<input className={campoBase('h-12 px-3')} value={respostas[id] ?? ''} onChange={(e) => setRespostas(v => ({ ...v, [id]: e.target.value }))} /></label>;
    })}
    <button type="button" onClick={enviar} disabled={enviando} className="inline-flex rounded-full bg-[#1D9E75] px-6 py-3 text-sm font-bold text-white shadow-[0_14px_26px_rgba(29,158,117,0.22)] disabled:opacity-60">
      {enviando ? 'Enviando...' : 'Enviar respostas'}
    </button>
    {erro && <p className="text-sm text-red-600">{erro}</p>}
  </div>;
}

function campoBase(extra: string) {
  return `mt-2 w-full rounded-2xl border border-[#E5DDD2] bg-white font-normal outline-none focus:border-[#1D9E75] focus:ring-2 focus:ring-[#E8F7F1] ${extra}`;
}
