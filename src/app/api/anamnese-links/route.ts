import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getClinicaId, getUserId, templateAnamneseAtivoDaClinica, usuarioPodeAcessarPaciente } from '@/lib/api/permissions';

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
    .from('paciente_anamnese_links')
    .select('*, anamnese_templates(nome)')
    .eq('paciente_id', pacienteId)
    .eq('revogado', false)
    .gt('expira_em', new Date().toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    const tabelaAusente = /schema cache|does not exist|not found|Could not find the table/i.test(error.message);
    if (tabelaAusente) {
      return NextResponse.json({
        data: [],
        respostas: [],
        setupPending: true,
        message: 'Estrutura de anamnese pre-atendimento ainda nao encontrada no banco.',
      });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const { data: respostas, error: respostasError } = await admin
    .from('paciente_anamnese_respostas')
    .select('id,enviado_em,template_id,avaliacao_id')
    .eq('paciente_id', pacienteId)
    .order('enviado_em', { ascending: false })
    .limit(10);

  return NextResponse.json({
    data: data ?? [],
    respostas: respostasError ? [] : respostas ?? [],
  });
}

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Sessao expirada' }, { status: 401 });

  const { pacienteId, templateId, avaliacaoId } = await req.json();
  if (!pacienteId || !templateId) return NextResponse.json({ error: 'Paciente e template sao obrigatorios' }, { status: 400 });

  if (!(await usuarioPodeAcessarPaciente(userId, pacienteId))) {
    return NextResponse.json({ error: 'Sem permissao para este paciente' }, { status: 403 });
  }

  const clinicaId = await getClinicaId();
  if (!clinicaId) return NextResponse.json({ error: 'Clinica nao encontrada' }, { status: 403 });

  const admin = createAdminClient();
  const template = await templateAnamneseAtivoDaClinica(templateId, clinicaId);
  if (!template) {
    return NextResponse.json({ error: 'Template nao encontrado, inativo ou fora da clinica' }, { status: 404 });
  }

  const { data, error } = await admin
    .from('paciente_anamnese_links')
    .insert({
      clinica_id: clinicaId,
      paciente_id: pacienteId,
      avaliacao_id: avaliacaoId || null,
      template_id: templateId,
      token: crypto.randomUUID(),
      criado_por: userId,
    })
    .select('*, anamnese_templates(nome)')
    .single();

  if (error) {
    const tabelaAusente = /schema cache|does not exist|not found|Could not find the table/i.test(error.message);
    return NextResponse.json({
      error: tabelaAusente
        ? 'A estrutura de anamnese pre-atendimento ainda precisa ser criada no Supabase.'
        : error.message,
    }, { status: 400 });
  }
  return NextResponse.json({ data });
}

export async function PATCH(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Sessao expirada' }, { status: 401 });

  const { token } = await req.json();
  if (!token) return NextResponse.json({ error: 'Token invalido' }, { status: 400 });

  const admin = createAdminClient();
  const { data: atual } = await admin
    .from('paciente_anamnese_links')
    .select('token, paciente_id')
    .eq('token', token)
    .maybeSingle();

  if (!atual?.paciente_id) return NextResponse.json({ error: 'Token nao encontrado' }, { status: 404 });
  if (!(await usuarioPodeAcessarPaciente(userId, atual.paciente_id))) {
    return NextResponse.json({ error: 'Sem permissao para este paciente' }, { status: 403 });
  }

  const { error } = await admin
    .from('paciente_anamnese_links')
    .update({ revogado: true })
    .eq('token', token);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
