import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getClinicaId, getUserId, usuarioPodeAcessarPaciente } from '@/lib/api/permissions';

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
    .from('consentimento_links')
    .select('*, consentimento_modelos(nome,tipo,versao)')
    .eq('paciente_id', pacienteId)
    .eq('revogado', false)
    .gt('expira_em', new Date().toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    const tabelaAusente = /schema cache|does not exist|not found|Could not find the table/i.test(error.message);
    if (tabelaAusente) {
      return NextResponse.json({
        data: [],
        aceites: [],
        setupPending: true,
        message: 'Estrutura de consentimentos ainda nao encontrada no banco.',
      });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const { data: aceites, error: aceitesError } = await admin
    .from('consentimento_aceites')
    .select('id,aceito_em,modelo_id,modelo_nome,modelo_tipo,texto_versao,ip,user_agent,token')
    .eq('paciente_id', pacienteId)
    .order('aceito_em', { ascending: false })
    .limit(20);

  return NextResponse.json({
    data: data ?? [],
    aceites: aceitesError ? [] : aceites ?? [],
  });
}

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Sessao expirada' }, { status: 401 });

  const { pacienteId, modeloId, avaliacaoId } = await req.json();
  if (!pacienteId || !modeloId) {
    return NextResponse.json({ error: 'Paciente e termo sao obrigatorios' }, { status: 400 });
  }

  if (!(await usuarioPodeAcessarPaciente(userId, pacienteId))) {
    return NextResponse.json({ error: 'Sem permissao para este paciente' }, { status: 403 });
  }

  const clinicaId = await getClinicaId();
  if (!clinicaId) return NextResponse.json({ error: 'Clinica nao encontrada' }, { status: 403 });

  const admin = createAdminClient();
  const { data: modelo } = await admin
    .from('consentimento_modelos')
    .select('id,clinica_id,ativo')
    .eq('id', modeloId)
    .eq('clinica_id', clinicaId)
    .eq('ativo', true)
    .maybeSingle();

  if (!modelo) return NextResponse.json({ error: 'Termo nao encontrado ou inativo' }, { status: 404 });

  const { data, error } = await admin
    .from('consentimento_links')
    .insert({
      clinica_id: clinicaId,
      paciente_id: pacienteId,
      avaliacao_id: avaliacaoId || null,
      modelo_id: modeloId,
      token: crypto.randomUUID(),
      criado_por: userId,
    })
    .select('*, consentimento_modelos(nome,tipo,versao)')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}

export async function PATCH(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Sessao expirada' }, { status: 401 });

  const { token } = await req.json();
  if (!token) return NextResponse.json({ error: 'Token invalido' }, { status: 400 });

  const admin = createAdminClient();
  const { data: atual } = await admin
    .from('consentimento_links')
    .select('token,paciente_id')
    .eq('token', token)
    .maybeSingle();

  if (!atual?.paciente_id) return NextResponse.json({ error: 'Token nao encontrado' }, { status: 404 });
  if (!(await usuarioPodeAcessarPaciente(userId, atual.paciente_id))) {
    return NextResponse.json({ error: 'Sem permissao para este paciente' }, { status: 403 });
  }

  const { error } = await admin
    .from('consentimento_links')
    .update({ revogado: true })
    .eq('token', token);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
