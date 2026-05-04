import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
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

  // descobre quais módulos já possuem registro
  const [anam, sv, pg, ant, fo, cr] = await Promise.all([
    supabase.from('anamnese').select('avaliacao_id').eq('avaliacao_id', params.id).maybeSingle(),
    supabase.from('sinais_vitais').select('avaliacao_id').eq('avaliacao_id', params.id).maybeSingle(),
    supabase.from('posturografia').select('avaliacao_id').eq('avaliacao_id', params.id).maybeSingle(),
    supabase.from('antropometria').select('avaliacao_id').eq('avaliacao_id', params.id).maybeSingle(),
    supabase.from('forca').select('avaliacao_id').eq('avaliacao_id', params.id).maybeSingle(),
    supabase.from('cardiorrespiratorio').select('avaliacao_id').eq('avaliacao_id', params.id).maybeSingle(),
  ]);

  const statusMap: Record<string, boolean> = {
    'anamnese': !!anam.data, 'sinais-vitais': !!sv.data,
    'posturografia': !!pg.data, 'antropometria': !!ant.data,
    'forca': !!fo.data, 'cardiorrespiratorio': !!cr.data,
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
