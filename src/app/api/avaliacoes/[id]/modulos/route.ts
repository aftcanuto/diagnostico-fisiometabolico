import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { ETAPAS_AVALIACAO } from '@/lib/steps';

const permitidos = new Set<string>(ETAPAS_AVALIACAO.flatMap(e => e.mod ? [e.mod] : []));
const schema = z.object({
  modulos: z.array(z.string().refine(m => permitidos.has(m))).min(1).max(12),
}).strict();

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sessão expirada.' }, { status: 401 });
  const input = schema.safeParse(await req.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: 'Selecione módulos válidos.' }, { status: 400 });

  // RLS applies to both reads and writes. Compare the previous selection to avoid lost additions.
  for (let tentativa = 0; tentativa < 3; tentativa++) {
    const { data: aval, error } = await supabase.from('avaliacoes')
      .select('id,status,modulos_selecionados').eq('id', id).maybeSingle();
    if (error) return NextResponse.json({ error: 'Não foi possível consultar a avaliação.' }, { status: 500 });
    if (!aval) return NextResponse.json({ error: 'Avaliação não encontrada ou sem acesso.' }, { status: 404 });
    if (aval.status !== 'em_andamento') return NextResponse.json({
      error: 'Reabra a avaliação antes de acrescentar módulos.',
    }, { status: 409 });
    const atuais = aval.modulos_selecionados ?? {};
    const novos = input.data.modulos.filter(m => atuais[m] !== true);
    if (!novos.length) return NextResponse.json({ ok: true });
    const modulos = { ...atuais, ...Object.fromEntries(novos.map(m => [m, true])) };
    let update = supabase.from('avaliacoes').update({ modulos_selecionados: modulos })
      .eq('id', id).eq('status', 'em_andamento');
    update = aval.modulos_selecionados == null
      ? update.is('modulos_selecionados', null)
      : update.eq('modulos_selecionados', JSON.stringify(atuais));
    const { data: saved, error: saveError } = await update.select('id').maybeSingle();
    if (saveError) return NextResponse.json({ error: 'Não foi possível adicionar os módulos.' }, { status: 500 });
    if (saved) return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: 'A avaliação mudou ou não permite edição. Atualize e tente novamente.' }, { status: 409 });
}
