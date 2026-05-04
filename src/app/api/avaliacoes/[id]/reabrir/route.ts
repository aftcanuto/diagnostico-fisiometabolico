import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();

  // Verificar autenticação
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  // Verificar que a avaliação existe e pertence à clínica do avaliador
  const { data: aval, error: avalErr } = await supabase
    .from('avaliacoes')
    .select('id, status, paciente_id, pacientes(clinica_id)')
    .eq('id', params.id)
    .single();

  if (avalErr || !aval) {
    return NextResponse.json({ error: 'Avaliação não encontrada' }, { status: 404 });
  }

  // Reabrir: mudar status de 'finalizada' para 'em_andamento'
  const { error: updateErr } = await supabase
    .from('avaliacoes')
    .update({ status: 'em_andamento' })
    .eq('id', params.id);

  if (updateErr) {
    return NextResponse.json({ error: 'Erro ao reabrir avaliação' }, { status: 500 });
  }

  // Redirecionar de volta para a página do paciente
  const { data: av2 } = await supabase
    .from('avaliacoes')
    .select('paciente_id, modulos_selecionados')
    .eq('id', params.id)
    .single();

  const mods = av2?.modulos_selecionados ?? {};
  const primeiroStep = mods.anamnese ? 'anamnese'
    : mods.sinais_vitais ? 'sinais-vitais'
    : mods.posturografia ? 'posturografia'
    : mods.bioimpedancia ? 'bioimpedancia'
    : mods.antropometria ? 'antropometria'
    : mods.flexibilidade ? 'flexibilidade'
    : mods.forca ? 'forca'
    : mods.cardiorrespiratorio ? 'cardiorrespiratorio'
    : 'revisao';

  // Redirecionar para o formulário da avaliação reaberta
  return NextResponse.redirect(
    new URL(`/avaliacoes/${params.id}/${primeiroStep}`, _req.url),
    303
  );
}
