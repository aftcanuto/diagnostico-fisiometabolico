import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { avaliacaoId, tipo, conteudo, textoEditado } = await req.json();
  if (!avaliacaoId || !tipo) return NextResponse.json({ error: 'parâmetros faltando' }, { status: 400 });

  const payload: any = { avaliacao_id: avaliacaoId, tipo };
  if (conteudo !== undefined) payload.conteudo = conteudo;
  if (textoEditado !== undefined) payload.texto_editado = textoEditado;
  payload.revisado_por = user.id;
  payload.revisado_em = new Date().toISOString();

  const { error } = await supabase.from('analises_ia')
    .upsert(payload, { onConflict: 'avaliacao_id,tipo' });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
