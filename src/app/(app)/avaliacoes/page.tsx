import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/Button';
import { Plus, FileText, Clock, CheckCircle } from 'lucide-react';
import { DeleteAvaliacaoButton } from '@/components/DeleteAvaliacaoButton';

function textoSeguro(valor: any, fallback = '-'): string {
  if (valor == null || valor === '') return fallback;
  if (typeof valor === 'string' || typeof valor === 'number' || typeof valor === 'boolean') return String(valor);
  if (Array.isArray(valor)) return textoSeguro(valor[0], fallback);
  if (typeof valor === 'object') return textoSeguro(valor.nome ?? valor.label ?? valor.tipo ?? valor.status ?? valor.id, fallback);
  return fallback;
}

function primeiroItem(valor: any) {
  return Array.isArray(valor) ? valor[0] : valor;
}

function numeroSeguro(valor: any): number | null {
  const base = primeiroItem(valor);
  const raw = typeof base === 'object' && base ? base.global ?? base.valor ?? base.score : base;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function dataSegura(valor: any) {
  const d = valor ? new Date(valor) : null;
  return d && !Number.isNaN(d.getTime()) ? d : new Date();
}

function primeiroModulo(avaliacao: any): string {
  const mods = avaliacao?.modulos_selecionados ?? {};
  if (mods.anamnese) return 'anamnese';
  if (mods.sinais_vitais) return 'sinais-vitais';
  if (mods.posturografia) return 'posturografia';
  if (mods.bioimpedancia) return 'bioimpedancia';
  if (mods.antropometria) return 'antropometria';
  if (mods.flexibilidade) return 'flexibilidade';
  if (mods.forca) return 'forca';
  if (mods.rml) return 'rml';
  if (mods.cardiorrespiratorio) return 'cardiorrespiratorio';
  if (mods.biomecanica_corrida || mods.biomecanica) return 'biomecanica';
  return 'revisao';
}

export default async function AvaliacoesPage() {
  const supabase = createClient();

  const { data: avals } = await supabase
    .from('avaliacoes')
    .select('id, data, tipo, status, modulos_selecionados, pacientes(id, nome, sexo, data_nascimento), scores(global)')
    .order('data', { ascending: false });

  const grupos = (avals ?? []).reduce<Record<string, any[]>>((acc, a: any) => {
    const mes = dataSegura(a.data).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    if (!acc[mes]) acc[mes] = [];
    acc[mes].push(a);
    return acc;
  }, {});

  const total = avals?.length ?? 0;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Avaliacoes</h1>
          <p className="text-sm text-slate-500 mt-1">
            {total} {total === 1 ? 'avaliacao' : 'avaliacoes'} no total
          </p>
        </div>
        <Link href="/avaliacoes/nova">
          <Button><Plus className="w-4 h-4" /> Nova avaliacao</Button>
        </Link>
      </div>

      {!avals?.length ? (
        <div className="text-center py-16 text-slate-400">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nenhuma avaliacao cadastrada ainda.</p>
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
                  const pac = primeiroItem(a.pacientes) ?? {};
                  const pacNome = textoSeguro(pac.nome, 'Paciente');
                  const pacId = textoSeguro(pac.id, '');
                  const tipo = textoSeguro(a.tipo, 'avaliacao');
                  const status = textoSeguro(a.status, 'em_andamento');
                  const scoreRaw = numeroSeguro(a.scores);
                  const score = scoreRaw != null && scoreRaw > 0 ? scoreRaw : null;
                  const finalizada = status === 'finalizada';
                  const scoreColor = score == null ? '#94a3b8' : score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444';
                  const avaliacaoHref = `/avaliacoes/${textoSeguro(a.id)}/${primeiroModulo(a)}`;

                  return (
                    <div key={textoSeguro(a.id)} className="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-xl hover:border-brand-300 hover:shadow-sm transition">
                      <Link href={avaliacaoHref} className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 grid place-items-center font-semibold text-sm flex-shrink-0">
                        {pacNome.charAt(0).toUpperCase()}
                      </Link>

                      <Link href={avaliacaoHref} className="flex-1 min-w-0">
                        <div className="font-medium text-slate-800">{pacNome}</div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {dataSegura(a.data).toLocaleDateString('pt-BR', { dateStyle: 'long' })} - {tipo}
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

                      <DeleteAvaliacaoButton avaliacaoId={textoSeguro(a.id)} />
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
