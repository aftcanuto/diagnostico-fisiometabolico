import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const { token, respostas } = await req.json();
  if (!token || !respostas || typeof respostas !== 'object') {
    return NextResponse.json({ error: 'Dados invalidos' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: link, error: linkError } = await admin
    .from('paciente_anamnese_links')
    .select('*')
    .eq('token', token)
    .eq('revogado', false)
    .gt('expira_em', new Date().toISOString())
    .maybeSingle();

  if (linkError || !link) {
    return NextResponse.json({ error: 'Link invalido ou expirado' }, { status: 404 });
  }
  if (link.respondido_em) {
    return NextResponse.json({ error: 'Esta anamnese ja foi enviada' }, { status: 409 });
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
  const userAgent = req.headers.get('user-agent');

  const { error } = await admin
    .from('paciente_anamnese_respostas')
    .insert({
      clinica_id: link.clinica_id,
      paciente_id: link.paciente_id,
      avaliacao_id: link.avaliacao_id,
      link_id: link.id,
      template_id: link.template_id,
      respostas,
      ip,
      user_agent: userAgent,
    });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await admin
    .from('paciente_anamnese_links')
    .update({ respondido_em: new Date().toISOString() })
    .eq('id', link.id);

  return NextResponse.json({ ok: true });
}
