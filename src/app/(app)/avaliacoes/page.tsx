import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/Button';
import { Plus, FileText, Clock, CheckCircle } from 'lucide-react';
import { DeleteAvaliacaoButton } from '@/components/DeleteAvaliacaoButton';

export default async function AvaliacoesPage() {
  const supabase = createClient();

  const { data: avals } = await supabase
    .from('avaliacoes')
    .select('id, data, tipo, status, modulos_selecionados, pacientes(id, nome, sexo, data_nascimento), scores(global)')
    .order('data', { ascending: false });

  const grupos = (avals ?? []).reduce<Record<string, any[]>>((acc, a) => {
    const mes = new Date(a.data).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    if (!acc[mes]) acc[mes] = [];
    acc[mes].push(a);
    return acc;
  }, {});

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Avaliações</h1>
          <p className="text-sm text-slate-500 mt-1">
            {avals?.length ?? 0} avaliação{(avals?.length ?? 0) !== 1 ? 'ões' : ''} no total
          </p>
        </div>
        <Link href="/avaliacoes/nova">
          <Button><Plus className="w-4 h-4" /> Nova avaliação</Button>
        </Link>
      </div>

      {!avals?.length ? (
        <div className="text-center py-16 text-slate-400">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nenhuma avaliação cadastrada ainda.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grupos).map(([mes, lista]) => (
            <div key={mes}>
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 capitalize">
                {mes}
              </h2>
              <div className="space-y-2">
                {lista.map((a: any) => {
                  const pac = Array.isArray(a.pacientes) ? a.pacientes[0] : a.pacientes;
                  const score = Array.isArray(a.scores) ? a.scores[0]?.global : a.scores?.global;
                  const finalizada = a.status === 'finalizada';
                  const scoreColor = score == null ? '#94a3b8' : score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444';

                  return (
                    <div key={a.id} className="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-xl hover:border-brand-300 hover:shadow-sm transition">
                      <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 grid place-items-center font-semibold text-sm flex-shrink-0">
                        {pac?.nome?.charAt(0)?.toUpperCase() ?? '?'}
                      </div>

                      <Link href={`/pacientes/${pac?.id}`} className="flex-1 min-w-0">
                        <div className="font-medium text-slate-800">{pac?.nome ?? 'Paciente'}</div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {new Date(a.data).toLocaleDateString('pt-BR', { dateStyle: 'long' })} · {a.tipo}
                        </div>
                      </Link>

                      {score != null && (
                        <div className="text-center flex-shrink-0 w-14">
                          <div className="text-lg font-bold" style={{ color: scoreColor }}>{score}</div>
                          <div className="text-xs text-slate-400">score</div>
                        </div>
                      )}

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {finalizada ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                            <CheckCircle className="w-3 h-3" /> Finalizada
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                            <Clock className="w-3 h-3" /> Em andamento
                          </span>
                        )}
                      </div>

                      <DeleteAvaliacaoButton avaliacaoId={a.id} />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
