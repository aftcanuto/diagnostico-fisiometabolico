import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: papel } = await supabase.rpc('current_papel');
  if (papel !== 'owner' && papel !== 'admin') {
    return NextResponse.json({ error: 'somente owner/admin' }, { status: 403 });
  }

  const { data: clinicaId } = await supabase.rpc('current_clinica_id');
  if (!clinicaId) return NextResponse.json({ error: 'sem clínica' }, { status: 403 });

  const { email, papel: novoPapel } = await req.json();
  if (!email) return NextResponse.json({ error: 'email obrigatório' }, { status: 400 });
  if (!['avaliador', 'admin'].includes(novoPapel)) {
    return NextResponse.json({ error: 'papel inválido' }, { status: 400 });
  }

  const admin = createAdminClient();

  // Procura se o e-mail já tem conta
  const { data: usuarios } = await admin.auth.admin.listUsers();
  const existente = usuarios?.users?.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());

  if (existente) {
    // Vincula direto à clínica
    const { error } = await admin.from('clinica_membros').insert({
      clinica_id: clinicaId, user_id: existente.id, papel: novoPapel, ativo: true,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, vinculadoDireto: true });
  }

  // Gera magic link para convite
  const { data, error } = await admin.auth.admin.generateLink({
    type: 'invite', email,
    options: {
      data: { clinica_convite_id: clinicaId, papel_convite: novoPapel },
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/login`,
    },
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true, url: data.properties?.action_link, vinculadoDireto: false });
}
