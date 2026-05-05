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

  const temForca = (row: any) => {
    if (!row) return false;
    if (row.preensao_dir_kgf != null || row.preensao_esq_kgf != null) return true;
    if (Array.isArray(row.sptech_testes) && row.sptech_testes.some((t: any) =>
      t?.lado_d?.kgf || t?.lado_d?.torque_nm || t?.lado_d?.rm1_kg ||
      t?.lado_e?.kgf || t?.lado_e?.torque_nm || t?.lado_e?.rm1_kg
    )) return true;
    if (Array.isArray(row.tracao_testes) && row.tracao_testes.some((t: any) =>
      t?.lado_d?.fim_kgf || t?.lado_e?.fim_kgf
    )) return true;
    if (Array.isArray(row.testes) && row.testes.some((t: any) => t?.nome || t?.valor)) return true;
    return false;
  };

  const temBioimpedancia = (row: any) => !!row && [
    'peso_kg', 'percentual_gordura', 'massa_gordura_kg',
    'massa_livre_gordura_kg', 'agua_corporal_kg', 'imc',
    'taxa_metabolica_basal_kcal', 'indice_apendicular',
    'idade_metabolica', 'gordura_visceral_nivel',
  ].some(k => row[k] != null && row[k] !== '');

  const temAntropometria = (row: any) => !!row && (
    row.peso != null ||
    row.estatura != null ||
    (row.dobras && Object.values(row.dobras).some((d: any) => d?.m1 || d?.m2 || d?.m3 || d?.media)) ||
    (row.circunferencias && Object.keys(row.circunferencias).length > 0) ||
    (row.diametros && Object.keys(row.diametros).length > 0)
  );

  const temFlexibilidade = (row: any) => !!row && (
    row.melhor_resultado != null ||
    row.tentativa_1 != null ||
    row.tentativa_2 != null ||
    row.tentativa_3 != null ||
    (Array.isArray(row.testes_adicionais) && row.testes_adicionais.length > 0)
  );

  const temCardio = (row: any) => !!row && [
    'vo2max', 'l2', 'vam', 'fc_max', 'fc_repouso', 'fc_limiar',
    'carga_limiar', 'carga_max', 've_max', 'ponto_limiar_tempo',
    'classificacao_vo2',
  ].some(k => row[k] != null && row[k] !== '');

  const temBiomecanica = (row: any) => !!row && (
    row.velocidade_kmh != null ||
    row.link_video ||
    row.foto_frame_url ||
    (row.metricas && Object.keys(row.metricas).length > 0) ||
    (row.angulos && Object.keys(row.angulos).length > 0) ||
    (row.graficos && Object.values(row.graficos).some(Boolean))
  );

  const statusMap: Record<string, boolean> = {
    anamnese: temDados(anam.data?.respostas ?? null),
    'sinais-vitais': temDados(sv.data),
    posturografia: temDados(pg.data),
    bioimpedancia: temBioimpedancia(bio.data),
    antropometria: temAntropometria(ant.data),
    flexibilidade: temFlexibilidade(flex.data),
    forca: temForca(fo.data),
    rml: temDados(rml.data),
    cardiorrespiratorio: temCardio(cr.data),
    biomecanica: temBiomecanica(biomec.data),
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
