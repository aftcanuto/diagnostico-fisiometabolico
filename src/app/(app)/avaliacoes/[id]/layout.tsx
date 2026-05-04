import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { StepNav } from '@/components/ui/StepNav';
import { buildSteps } from '@/lib/steps';
import { calcIdade } from '@/lib/calculations/antropometria';

export default async function AvaliacaoLayout({
  params, children,
}: { params: { id: string }; children: React.ReactNode }) {
  const supabase = createClient();
  const { data: aval } = await supabase
    .from('avaliacoes').select('*, pacientes(*)').eq('id', params.id).single();
  if (!aval) notFound();

  const admin = createAdminClient();
  const [anam, sv, pg, bio, ant, flex, fo, rml, cr, biomec] = await Promise.all([
    admin.from('anamnese').select('respostas,template_id').eq('avaliacao_id', params.id).maybeSingle(),
    admin.from('sinais_vitais').select('*').eq('avaliacao_id', params.id).maybeSingle(),
    admin.from('posturografia').select('*').eq('avaliacao_id', params.id).maybeSingle(),
    admin.from('bioimpedancia').select('*').eq('avaliacao_id', params.id).maybeSingle(),
    admin.from('antropometria').select('*').eq('avaliacao_id', params.id).maybeSingle(),
    admin.from('flexibilidade').select('*').eq('avaliacao_id', params.id).maybeSingle(),
    admin.from('forca').select('*').eq('avaliacao_id', params.id).maybeSingle(),
    admin.from('rml').select('*').eq('avaliacao_id', params.id).maybeSingle(),
    admin.from('cardiorrespiratorio').select('*').eq('avaliacao_id', params.id).maybeSingle(),
    admin.from('biomecanica_corrida').select('*').eq('avaliacao_id', params.id).maybeSingle(),
  ]);

  const temDados = (row: any) => {
    if (!row) return false;
    const ignorar = new Set(['id', 'avaliacao_id', 'created_at', 'updated_at', 'clinica_id']);
    return Object.entries(row).some(([k, v]) => {
      if (ignorar.has(k)) return false;
      if (v == null || v === '') return false;
      if (Array.isArray(v)) return v.length > 0;
      if (typeof v === 'object') return Object.keys(v).length > 0;
      return true;
    });
  };

  const statusMap: Record<string, boolean> = {
    anamnese: temDados(anam.data?.respostas ?? null),
    'sinais-vitais': temDados(sv.data),
    posturografia: temDados(pg.data),
    bioimpedancia: temDados(bio.data),
    antropometria: temDados(ant.data),
    flexibilidade: temDados(flex.data),
    forca: temDados(fo.data),
    rml: temDados(rml.data),
    cardiorrespiratorio: temDados(cr.data),
    biomecanica: temDados(biomec.data),
  };

  const steps = buildSteps(params.id, aval.modulos_selecionados, statusMap);
  const p = aval.pacientes;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <Link href={`/pacientes/${p.id}`} className="text-xs text-brand-600 hover:underline">
            ← {p.nome}
          </Link>
          <h1 className="text-xl font-bold text-slate-800 mt-1">
            Avaliação de {new Date(aval.data).toLocaleDateString('pt-BR')}
          </h1>
          <p className="text-xs text-slate-500">
            {p.sexo === 'M' ? 'Masc' : 'Fem'} · {calcIdade(p.data_nascimento)} anos · {aval.tipo}
          </p>
        </div>
      </div>
      <StepNav steps={steps} />
      <div>{children}</div>
    </div>
  );
}
