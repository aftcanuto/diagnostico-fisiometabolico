import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { anthropometrySchema, calculateAnthropometry, legacyProjection } from '@/lib/anthropometry';
import { qualificationSchema } from '@/lib/isak-qualification';

export async function saveAnthropometryV2(avaliacaoId: string, payload: any) {
  const parsed = anthropometrySchema.safeParse(payload.registro_v2);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Coleta invalida.' }, { status: 400 });
  if (payload.expected_revision !== null && (!Number.isInteger(payload.expected_revision) || payload.expected_revision < 1)) {
    return NextResponse.json({ error: 'Revisao ausente. Recarregue a avaliacao.' }, { status: 400 });
  }
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sessao expirada.' }, { status: 401 });
  const { data: aval, error: avError } = await sb.from('avaliacoes')
    .select('id,data,status,modulos_selecionados,pacientes(data_nascimento,sexo)').eq('id', avaliacaoId).maybeSingle();
  if (avError || !aval) return NextResponse.json({ error: 'Avaliacao indisponivel para esta sessao.' }, { status: 403 });
  if (aval.status !== 'em_andamento') return NextResponse.json({ error: 'Reabra a avaliacao para editar a coleta.' }, { status: 409 });
  if (aval.modulos_selecionados?.antropometria === false) return NextResponse.json({ error: 'Inclua o modulo Antropometria nesta avaliacao antes de salvar.' }, { status: 409 });
  const patient = Array.isArray(aval.pacientes) ? aval.pacientes[0] : aval.pacientes;
  if (!patient?.data_nascimento || !['M', 'F'].includes(patient.sexo)) return NextResponse.json({ error: 'Confira o cadastro do paciente.' }, { status: 400 });
  const { data: current, error: readError } = await sb.from('antropometria').select('*').eq('avaliacao_id', avaliacaoId).maybeSingle();
  if (readError) return NextResponse.json({ error: 'Nao foi possivel consultar a antropometria. Confira a migration.' }, { status: 500 });
  if (current && !current.registro_v2) return NextResponse.json({ error: 'Avaliacao legada preservada: use o formulario original.' }, { status: 409 });
  if ((current?.revision_v2 ?? null) !== payload.expected_revision) return NextResponse.json({ error: 'Coleta alterada em outra sessao. Recarregue antes de salvar.' }, { status: 409 });

  const results = calculateAnthropometry(parsed.data, { date: aval.data, birthDate: patient.data_nascimento, sex: patient.sexo });
  const { data: professional, error: professionalError } = await sb.from('avaliadores').select('nome,qualificacao_isak').eq('id', user.id).maybeSingle();
  if (professionalError) return NextResponse.json({ error: 'Nao foi possivel carregar o profissional. Confira a migration.' }, { status: 500 });
  const qualification = qualificationSchema.safeParse(professional?.qualificacao_isak);
  const data = {
    ...legacyProjection(parsed.data, results),
    avaliacao_id: avaliacaoId, registro_v2: parsed.data, resultados_v2: { ...results,
      professional: { name: professional?.nome ?? '', qualification: qualification.success ? qualification.data : null } },
    revision_v2: (current?.revision_v2 ?? 0) + 1, updated_at: new Date().toISOString(),
  };
  // The single row write persists raw collection, selected methods and derived values atomically.
  const operation = current
    ? sb.from('antropometria').update(data).eq('avaliacao_id', avaliacaoId).eq('revision_v2', current.revision_v2)
    : sb.from('antropometria').insert(data);
  const saved = await operation.select('*').maybeSingle();
  if (saved.error) return NextResponse.json({ error: saved.error.code === '23505'
    ? 'Outra sessao ja iniciou esta coleta. Recarregue a pagina.'
    : 'Falha ao salvar. Confira a migration e suas permissoes.' }, { status: saved.error.code === '23505' ? 409 : 500 });
  if (!saved.data) return NextResponse.json({ error: 'Coleta alterada ou sem permissao de edicao. Recarregue.' }, { status: 409 });
  return NextResponse.json({ ok: true, data: saved.data });
}
