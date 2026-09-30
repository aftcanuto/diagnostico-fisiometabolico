'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Loader2, RotateCcw } from 'lucide-react';
import { ETAPAS_AVALIACAO } from '@/lib/steps';
import type { ModulosSelecionados } from '@/types';

export function AdicionarModulos({ avaliacaoId, modulos, status }: {
  avaliacaoId: string; modulos: ModulosSelecionados; status: string;
}) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const disponiveis = ETAPAS_AVALIACAO.filter(e => e.mod && !modulos?.[e.mod]);
  if (status === 'arquivada' || !disponiveis.length) return null;

  async function adicionar() {
    if (!window.confirm('Adicionar os módulos e abrir o primeiro? Alterações ainda não salvas no formulário atual serão perdidas.')) return;
    setSalvando(true);
    setErro('');
    try {
      const res = await fetch(`/api/avaliacoes/${avaliacaoId}/modulos`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modulos: selecionados }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Falha ao adicionar módulos.');
      const primeiro = disponiveis.find(e => e.mod && selecionados.includes(e.mod));
      setSelecionados([]);
      setAberto(false);
      router.push(`/avaliacoes/${avaliacaoId}/${primeiro?.key ?? 'revisao'}`);
      router.refresh();
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Falha de conexão. Tente novamente.');
    } finally { setSalvando(false); }
  }

  return <section className="min-w-0 border-b border-slate-200 pb-4">
    <button type="button" onClick={() => setAberto(!aberto)} aria-expanded={aberto}
      aria-controls="adicionar-modulos" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700 py-2">
      <Plus size={16} aria-hidden="true" /> Adicionar módulos
    </button>
    {aberto && <div id="adicionar-modulos" className="mt-2 space-y-4">
      {status === 'finalizada' ? <form action={`/api/avaliacoes/${avaliacaoId}/reabrir`} method="post">
        <button type="submit" className="inline-flex items-center gap-2 text-sm text-brand-700"
          onClick={event => { if (!window.confirm('Reabrir esta avaliação para complementação? Ela voltará a ficar em andamento até ser finalizada novamente.')) event.preventDefault(); }}>
          <RotateCcw size={16} aria-hidden="true" /> Reabrir para complementar
        </button>
      </form> : <>
        <fieldset disabled={salvando} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          <legend className="sr-only">Módulos disponíveis</legend>
          {disponiveis.map(etapa => <label key={etapa.key} className="flex min-w-0 items-center gap-2 py-2 text-sm text-slate-700">
            <input type="checkbox" checked={selecionados.includes(etapa.mod!)}
              onChange={event => setSelecionados(anteriores => event.target.checked
                ? [...anteriores, etapa.mod!] : anteriores.filter(m => m !== etapa.mod))} />
            <span>{etapa.label}</span>
          </label>)}
        </fieldset>
        <button type="button" disabled={salvando || !selecionados.length} onClick={adicionar}
          className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
          {salvando ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}
          Adicionar e abrir
        </button>
      </>}
      {erro && <p role="alert" className="text-sm text-red-700">{erro}</p>}
    </div>}
  </section>;
}
