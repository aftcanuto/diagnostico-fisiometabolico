import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

async function getUserId() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

async function garantirAvaliador(userId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const admin = createAdminClient();
  const nome =
    user?.user_metadata?.nome ??
    user?.user_metadata?.name ??
    user?.email?.split('@')[0] ??
    'Avaliador';

  await admin
    .from('avaliadores')
    .upsert({ id: userId, nome }, { onConflict: 'id' });
}

async function usuarioPodeAcessarPaciente(userId: string, pacienteId: string) {
  const supabase = createClient();
  const { data: pacienteVisivel } = await supabase
    .from('pacientes')
    .select('id')
    .eq('id', pacienteId)
    .maybeSingle();

  if (pacienteVisivel?.id) return true;

  const admin = createAdminClient();
  const { data: paciente, error: erroPaciente } = await admin
    .from('pacientes')
    .select('id, avaliador_id, clinica_id')
    .eq('id', pacienteId)
    .maybeSingle();

  if (erroPaciente || !paciente) return false;
  if (paciente.avaliador_id === userId) return true;
  if (!paciente.clinica_id) return false;

  const { data: membro, error: erroMembro } = await admin
    .from('clinica_membros')
    .select('id')
    .eq('clinica_id', paciente.clinica_id)
    .eq('user_id', userId)
    .eq('ativo', true)
    .maybeSingle();

  return !erroMembro && !!membro;
}

export async function GET(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Sessao expirada' }, { status: 401 });

  const pacienteId = req.nextUrl.searchParams.get('pacienteId') ?? '';
  if (!pacienteId) return NextResponse.json({ error: 'Paciente invalido' }, { status: 400 });

  const permitido = await usuarioPodeAcessarPaciente(userId, pacienteId);
  if (!permitido) return NextResponse.json({ error: 'Sem permissao para este paciente' }, { status: 403 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('paciente_tokens')
    .select('*')
    .eq('paciente_id', pacienteId)
    .eq('revogado', false)
    .gt('expira_em', new Date().toISOString())
    .order('criado_em', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data: data ?? [] });
}

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Sessao expirada' }, { status: 401 });

  const { pacienteId } = await req.json();
  if (!pacienteId) return NextResponse.json({ error: 'Paciente invalido' }, { status: 400 });

  const permitido = await usuarioPodeAcessarPaciente(userId, pacienteId);
  if (!permitido) return NextResponse.json({ error: 'Sem permissao para este paciente' }, { status: 403 });

  const admin = createAdminClient();
  await garantirAvaliador(userId);
  const { data, error } = await admin
    .from('paciente_tokens')
    .insert({ paciente_id: pacienteId, avaliador_id: userId })
    .select('*')
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
  const { data: atual, error: erroToken } = await admin
    .from('paciente_tokens')
    .select('token, paciente_id')
    .eq('token', token)
    .maybeSingle();

  if (erroToken || !atual?.paciente_id) {
    return NextResponse.json({ error: 'Token nao encontrado' }, { status: 404 });
  }

  const permitido = await usuarioPodeAcessarPaciente(userId, atual.paciente_id);
  if (!permitido) return NextResponse.json({ error: 'Sem permissao para este paciente' }, { status: 403 });

  const { error } = await admin
    .from('paciente_tokens')
    .update({ revogado: true })
    .eq('token', token);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
