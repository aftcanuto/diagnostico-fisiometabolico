'use client';

import { useState } from 'react';

type AceiteAvulso = {
  comprovante_codigo?: string | null;
  aceito_em?: string | null;
  nivel_evidencia?: 'completo' | 'parcial_legado' | null;
  comprovante_url?: string | null;
};

export function DocumentoPreTestePublico({
  token,
  tipo,
  campos = [],
  aceiteInicial = null,
}: {
  token: string;
  tipo: string;
  campos?: any[];
  aceiteInicial?: AceiteAvulso | null;
}) {
  const [respostas, setRespostas] = useState<Record<string, any>>({});
  const [enviando, setEnviando] = useState(false);
  const [concluido, setConcluido] = useState(Boolean(aceiteInicial));
  const [confirmado, setConfirmado] = useState(false);
  const [signatarioNome, setSignatarioNome] = useState('');
  const [signatarioCpf, setSignatarioCpf] = useState('');
  const [aceite, setAceite] = useState<AceiteAvulso | null>(aceiteInicial);
  const [erro, setErro] = useState('');

  async function enviar() {
    setEnviando(true); setErro('');
    const response = await fetch('/api/documentos-pre-teste-publico', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        respostas,
        aceitar: tipo === 'consentimento' ? confirmado : undefined,
        signatarioNome: tipo === 'consentimento' ? signatarioNome : undefined,
        signatarioCpf: tipo === 'consentimento' ? signatarioCpf : undefined,
      }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok && !(response.status === 409 && body.aceite)) {
      setErro(body.error ?? 'Não foi possível concluir.');
    } else {
      setAceite(body.aceite ?? null);
      setConcluido(true);
    }
    setEnviando(false);
  }

  if (concluido && tipo === 'consentimento') {
    const comprovanteUrl = aceite?.comprovante_url
      ?? `/api/documentos-pre-teste-comprovante?token=${encodeURIComponent(token)}`;
    return <div className="rounded-3xl border border-[#1D9E75]/15 bg-[#E8F7F1] p-6 text-[#155C47]">
      <div className="font-serif text-2xl font-semibold">Termo aceito</div>
      {aceite?.comprovante_codigo && <div className="mt-1 font-mono text-xs font-bold">{aceite.comprovante_codigo}</div>}
      <p className="mt-3 text-sm leading-6">
        {aceite?.nivel_evidencia === 'parcial_legado'
          ? 'Este é um comprovante parcial de um aceite registrado antes da trilha completa de evidências.'
          : 'Seu aceite foi registrado com data, identificação declarada, dados técnicos e hashes de integridade.'}
      </p>
      <a href={comprovanteUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex rounded-full border border-[#155C47]/15 bg-white px-5 py-2.5 text-sm font-bold shadow-sm hover:bg-[#F5FBF8]">
        Abrir comprovante em PDF
      </a>
    </div>;
  }
  if (concluido) return <div className="rounded-3xl border border-[#1D9E75]/15 bg-[#E8F7F1] p-6 text-center font-semibold text-[#155C47]">Documento concluído com sucesso.</div>;
  if (tipo === 'consentimento') return <div className="mt-6 space-y-4">
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="text-sm font-semibold text-[#334155]">Nome completo de quem está consentindo
        <input autoComplete="name" className={campoBase('h-12 px-3')} value={signatarioNome} onChange={(e) => setSignatarioNome(e.target.value)} />
      </label>
      <label className="text-sm font-semibold text-[#334155]">CPF de quem está consentindo
        <input inputMode="numeric" autoComplete="off" maxLength={14} placeholder="000.000.000-00" className={campoBase('h-12 px-3')} value={signatarioCpf} onChange={(e) => setSignatarioCpf(formatarCpf(e.target.value))} />
      </label>
    </div>
    <label className="flex items-start gap-3 rounded-3xl border border-[#E5DDD2] bg-[#FAF5EF] p-4 text-sm text-[#5A5A5A]">
      <input type="checkbox" className="mt-1 accent-[#1D9E75]" checked={confirmado} onChange={(e) => setConfirmado(e.target.checked)} />
      <span>Li integralmente o termo apresentado, compreendi seu conteúdo e confirmo meu consentimento de forma livre e expressa.</span>
    </label>
    <button type="button" onClick={enviar} disabled={!confirmado || enviando || !signatarioNome.trim() || signatarioCpf.replace(/\D/g, '').length !== 11} className="inline-flex rounded-full bg-[#1D9E75] px-6 py-3 text-sm font-bold text-white shadow-[0_14px_26px_rgba(29,158,117,0.22)] disabled:opacity-60">
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

function formatarCpf(value: string) {
  return value
    .replace(/\D/g, '')
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}
