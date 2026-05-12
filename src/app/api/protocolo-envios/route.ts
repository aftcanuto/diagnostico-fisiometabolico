import { NextRequest, NextResponse } from 'next/server';
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
      observacao: 'Registro criado. O envio automatico por e-mail/WhatsApp ainda nao esta configurado.',
    })
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}
