import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const clinicaId = req.nextUrl.searchParams.get('clinicaId');
  const produtoId = req.nextUrl.searchParams.get('produtoId');
  const data = req.nextUrl.searchParams.get('data');

  if (!clinicaId || !produtoId || !data) {
    return NextResponse.json({ error: 'Informe produto, clínica e data.' }, { status: 400 });
  }

  const admin = createAdminClient();
  await expirarPedidosAntigos(admin);
  const { data: produto } = await admin
    .from('catalogo_produtos')
    .select('id,clinica_id,agenda_horarios,ativo')
    .eq('id', produtoId)
    .eq('clinica_id', clinicaId)
    .eq('ativo', true)
    .maybeSingle();

  if (!produto) {
    return NextResponse.json({ error: 'Produto não encontrado.' }, { status: 404 });
  }

  const horarios = horariosDoDia(data, produto.agenda_horarios);
  const { data: ocupados } = await admin
    .from('catalogo_agendamentos')
    .select('horario_preferido')
    .eq('catalogo_produto_id', produtoId)
    .eq('data_preferida', data)
    .in('status', ['aguardando_pagamento', 'pagamento_recebido', 'confirmado'])
    .not('horario_preferido', 'is', null);

  const bloqueados = new Set((ocupados ?? []).map((item: { horario_preferido: string | null }) => String(item.horario_preferido)));
  const disponiveis = horarios.filter(horario => !bloqueados.has(horario));

  return NextResponse.json({ horarios: disponiveis, bloqueados: [...bloqueados] });
}

function horariosDoDia(data: string, agenda: unknown) {
  if (!agenda || typeof agenda !== 'object' || Array.isArray(agenda)) return [];
  const horarios = (agenda as Record<string, unknown>)[data];
  if (!Array.isArray(horarios)) return [];
  return horarios.map(String).filter(horario => /^([01]\d|2[0-3]):[0-5]\d$/.test(horario)).sort();
}

async function expirarPedidosAntigos(admin: ReturnType<typeof createAdminClient>) {
  await admin
    .from('catalogo_agendamentos')
    .update({ status: 'expirado' })
    .eq('status', 'aguardando_pagamento')
    .lt('expires_at', new Date().toISOString());
}
