import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { createAdminClient } from '@/lib/supabase/server';
import { getClinicaId, getUserId, recomendacoesAtivasDaClinica, usuarioPodeAcessarPaciente } from '@/lib/api/permissions';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Sessao expirada' }, { status: 401 });

  const pacienteId = req.nextUrl.searchParams.get('pacienteId') ?? '';
  if (!pacienteId) return NextResponse.json({ error: 'Paciente invalido' }, { status: 400 });

  if (!(await usuarioPodeAcessarPaciente(userId, pacienteId))) {
    return NextResponse.json({ error: 'Sem permissao para este paciente' }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('protocolo_envios')
    .select('*')
    .eq('paciente_id', pacienteId)
    .order('enviado_em', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data: data ?? [] });
}

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Sessao expirada' }, { status: 401 });

  const { pacienteId, recomendacoesIds, avaliacaoId } = await req.json();
  if (!pacienteId || !Array.isArray(recomendacoesIds) || recomendacoesIds.length === 0) {
    return NextResponse.json({ error: 'Selecione ao menos uma recomendacao' }, { status: 400 });
  }

  if (!(await usuarioPodeAcessarPaciente(userId, pacienteId))) {
    return NextResponse.json({ error: 'Sem permissao para este paciente' }, { status: 403 });
  }

  const clinicaId = await getClinicaId();
  if (!clinicaId) return NextResponse.json({ error: 'Clinica nao encontrada' }, { status: 403 });

  const admin = createAdminClient();
  const recomendacoesValidas = await recomendacoesAtivasDaClinica(recomendacoesIds, clinicaId);
  if (recomendacoesValidas.length !== new Set(recomendacoesIds).size) {
    return NextResponse.json({ error: 'Ha recomendacoes invalidas, inativas ou fora da clinica' }, { status: 400 });
  }

  const { data: paciente } = await admin
    .from('pacientes')
    .select('email')
    .eq('id', pacienteId)
    .maybeSingle();

  const { data, error } = await admin
    .from('protocolo_envios')
    .insert({
      clinica_id: clinicaId,
      paciente_id: pacienteId,
      avaliacao_id: avaliacaoId || null,
      recomendacoes_ids: recomendacoesIds,
      canal: 'email',
      destino: paciente?.email ?? null,
      status: 'registrado',
      enviado_por: userId,
      token: randomUUID(),
      expira_em: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      revogado: false,
      observacao: 'Link publico gerado para compartilhamento das recomendacoes pre-teste.',
    })
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}

export async function PATCH(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Sessao expirada' }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'Link invalido' }, { status: 400 });

  const admin = createAdminClient();
  const { data: envio, error: buscaError } = await admin
    .from('protocolo_envios')
    .select('id, paciente_id')
    .eq('id', id)
    .maybeSingle();

  if (buscaError || !envio) {
    return NextResponse.json({ error: buscaError?.message ?? 'Link nao encontrado' }, { status: 404 });
  }

  if (!(await usuarioPodeAcessarPaciente(userId, envio.paciente_id))) {
    return NextResponse.json({ error: 'Sem permissao para este paciente' }, { status: 403 });
  }

  const { data, error } = await admin
    .from('protocolo_envios')
    .update({ revogado: true, status: 'revogado' })
    .eq('id', id)
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}
