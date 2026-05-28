import Link from 'next/link';
import { ClipboardList, FileText } from 'lucide-react';

type EventoProntuario = {
  id: string;
  avaliacao_id?: string | null;
  tipo: string;
  titulo: string;
  data_evento: string;
  status: string;
  resumo?: string | null;
  conclusao?: string | null;
  achados?: Record<string, any> | null;
  scores?: Record<string, any> | null;
};

function dataBR(valor?: string | null) {
  if (!valor) return 'Sem data';
  const data = new Date(`${valor}T12:00:00`);
  if (Number.isNaN(data.getTime())) return valor;
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeZone: 'America/Sao_Paulo' }).format(data);
}

function scoreLinha(scores?: Record<string, any> | null) {
  if (!scores) return [];
  return [
    ['Global', scores.global],
    ['Postura', scores.postura],
    ['Composicao', scores.composicao_corporal],
    ['Forca', scores.forca],
    ['Flexibilidade', scores.flexibilidade],
    ['RML', scores.rml],
    ['Cardio', scores.cardiorrespiratorio],
  ].filter(([, valor]) => valor !== null && valor !== undefined && valor !== '');
}

export function ProntuarioPaciente({ eventos }: { eventos: EventoProntuario[] }) {
  const ordenados = [...(eventos ?? [])].sort((a, b) => {
    const dataA = new Date(a.data_evento ?? a.id).getTime();
    const dataB = new Date(b.data_evento ?? b.id).getTime();
    return dataB - dataA;
  });

  return (
    <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-brand-600">
            <ClipboardList className="w-4 h-4" />
            Prontuario
          </div>
          <h2 className="mt-2 text-lg font-bold text-slate-900">Historico clinico longitudinal</h2>
          <p className="mt-1 text-sm text-slate-500">
            Achados, scores e conclusoes importados automaticamente das avaliacoes finalizadas.
          </p>
        </div>
        <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500">
          {ordenados.length} registro{ordenados.length !== 1 ? 's' : ''}
        </span>
      </div>

      {!ordenados.length ? (
        <div className="p-6 text-sm text-slate-400">Nenhum evento de prontuario registrado ainda.</div>
      ) : (
        <div className="divide-y divide-slate-100">
          {ordenados.map((evento) => {
            const scores = scoreLinha(evento.scores);
            const achados = Object.values(evento.achados ?? {}).filter(Boolean).slice(0, 4);
            return (
              <article key={evento.id} className="p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-slate-400">{dataBR(evento.data_evento)}</span>
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                        {evento.status}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                        {evento.tipo}
                      </span>
                    </div>
                    <h3 className="mt-1 text-base font-bold text-slate-900">{evento.titulo}</h3>
                    {evento.resumo && <p className="mt-2 text-sm leading-relaxed text-slate-600">{evento.resumo}</p>}
                  </div>
                  {evento.avaliacao_id && (
                    <Link
                      href={`/avaliacoes/${evento.avaliacao_id}/revisao`}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-white"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      Abrir avaliacao
                    </Link>
                  )}
                </div>

                {scores.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
                    {scores.map(([label, valor]) => (
                      <div key={label} className="rounded-lg bg-slate-50 px-3 py-2">
                        <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</div>
                        <div className="mt-1 text-lg font-bold text-slate-900">{valor}</div>
                      </div>
                    ))}
                  </div>
                )}

                {achados.length > 0 && (
                  <div className="mt-4 grid gap-2 md:grid-cols-2">
                    {achados.map((achado: any, idx) => (
                      <div key={`${evento.id}-achado-${idx}`} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                        <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          {achado.nome ?? 'Modulo'}
                        </div>
                        <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-slate-600">
                          {achado.analise ?? 'Analise ainda nao registrada.'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {evento.conclusao && (
                  <div className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50 p-3">
                    <div className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">Conclusao final</div>
                    <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-emerald-950">{evento.conclusao}</p>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
