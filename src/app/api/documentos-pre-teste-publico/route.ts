import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const { token, respostas, aceitar } = await req.json();
  const admin = createAdminClient();
  const { data: envio } = await admin.from('documentos_pre_teste_avulsos').select('id,tipo,revogado,expira_em').eq('token', token).maybeSingle();
  if (!envio || envio.revogado || new Date(envio.expira_em).getTime() < Date.now()) {
    return NextResponse.json({ error: 'Link inválido ou expirado' }, { status: 404 });
  }

  const atualizacao = envio.tipo === 'anamnese'
    ? { respostas: respostas ?? {}, respondido_em: new Date().toISOString() }
    : envio.tipo === 'consentimento' && aceitar
      ? { aceito_em: new Date().toISOString() }
      : null;
  if (!atualizacao) return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });

  const { error } = await admin.from('documentos_pre_teste_avulsos').update(atualizacao).eq('id', envio.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
