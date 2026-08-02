'use client';

import { useState } from 'react';

type ComprovanteAceite = {
  aceito_em?: string | null;
  ip?: string | null;
  user_agent?: string | null;
  modelo_nome?: string | null;
  texto_versao?: number | null;
  texto_hash?: string | null;
  comprovante_codigo?: string | null;
  revogado?: boolean | null;
  revogado_em?: string | null;
  motivo_revogacao?: string | null;
};

function dataHora(valor?: string | null) {
  if (!valor) return 'Registro indisponível';
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
      setErro('Marque a confirmação de leitura para aceitar o termo.');
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
      setErro(body.error ?? 'Não foi possível registrar o aceite.');
      return;
    }
    setComprovante(body.aceite ?? null);
    setConcluido(true);
  }

  if (concluido) {
    const comprovanteUrl = `/pre-atendimento/consentimento/${token}/comprovante`;
    return (
      <div className="rounded-3xl border border-[#1D9E75]/15 bg-[#E8F7F1] p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="font-serif text-2xl font-semibold tracking-[-0.035em] text-[#155C47]">{comprovante?.revogado ? 'Termo aceito e revogado' : 'Termo aceito'}</h2>
            {comprovante?.comprovante_codigo && (
              <p className="mt-1 font-mono text-xs font-semibold text-[#155C47]">{comprovante.comprovante_codigo}</p>
            )}
          </div>
          <a
            href={comprovanteUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-full border border-[#155C47]/15 bg-white px-4 py-2 text-sm font-semibold text-[#155C47] shadow-sm hover:bg-[#E8F7F1]"
          >
            Abrir comprovante
          </a>
        </div>
        <p className="mt-2 text-sm text-[#155C47]">
          {comprovante?.revogado
            ? 'Este comprovante registra o aceite original e a revogação posterior.'
            : 'Este comprovante registra o aceite digital do termo.'}
        </p>
        <div className="mt-5 grid gap-3 rounded-2xl border border-[#1D9E75]/15 bg-white/70 p-4 text-sm text-[#155C47] md:grid-cols-2">
          <div><span className="block text-xs font-semibold uppercase tracking-wide text-[#155C47]/70">Data e hora</span>{dataHora(comprovante?.aceito_em)}</div>
          <div><span className="block text-xs font-semibold uppercase tracking-wide text-[#155C47]/70">Versão do termo</span>{comprovante?.texto_versao ?? '-'}</div>
          <div><span className="block text-xs font-semibold uppercase tracking-wide text-[#155C47]/70">IP registrado</span>{comprovante?.ip ?? 'Não registrado'}</div>
          <div><span className="block text-xs font-semibold uppercase tracking-wide text-[#155C47]/70">Token</span><span className="font-mono text-xs">{token}</span></div>
          <div className="md:col-span-2">
            <span className="block text-xs font-semibold uppercase tracking-wide text-[#155C47]/70">Hash de integridade</span>
            <span className="break-all font-mono text-xs">{comprovante?.texto_hash ?? 'Não registrado'}</span>
          </div>
          <div className="md:col-span-2"><span className="block text-xs font-semibold uppercase tracking-wide text-[#155C47]/70">Dispositivo/navegador</span>{comprovante?.user_agent ?? 'Não registrado'}</div>
          {comprovante?.revogado && (
            <div className="md:col-span-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-amber-900">
              <span className="block text-xs font-semibold uppercase tracking-wide text-amber-700">Revogação</span>
              Revogado em {dataHora(comprovante.revogado_em)}. {comprovante.motivo_revogacao ?? ''}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 border-t border-[#E5DDD2] pt-5">
      {erro && <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</div>}
      <label className="flex items-start gap-3 rounded-3xl border border-[#E5DDD2] bg-[#FAF5EF] p-4 text-sm text-[#5A5A5A]">
        <input
          type="checkbox"
          className="mt-1 accent-[#1D9E75]"
          checked={aceito}
          onChange={e => setAceito(e.target.checked)}
        />
        <span>Li o termo acima, compreendi as informações apresentadas e confirmo meu aceite digital.</span>
      </label>
      <div className="flex justify-end">
        <button type="button" onClick={confirmar} disabled={enviando} className="inline-flex rounded-full bg-[#1D9E75] px-6 py-3 text-sm font-bold text-white shadow-[0_14px_26px_rgba(29,158,117,0.22)] disabled:opacity-60">
          {enviando ? 'Registrando...' : 'Aceitar termo'}
        </button>
      </div>
    </div>
  );
}
