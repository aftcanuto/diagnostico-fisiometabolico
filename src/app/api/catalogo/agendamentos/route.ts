import { NextRequest, NextResponse } from 'next/server';
import { PUBLIC_APP_ORIGIN } from '@/lib/public-origin';
import { createAdminClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { clinicaId, produtoId, nome, telefone, email, dataPreferida, horarioPreferido, cupomCodigo, observacoes } = body;
  if (!clinicaId || !produtoId || !nome?.trim() || !telefone?.trim()) {
    return NextResponse.json({ error: 'Informe nome e telefone para iniciar o pagamento.' }, { status: 400 });
  }

  const admin = createAdminClient();
  await expirarPedidosAntigos(admin);
  const { data: produto } = await admin
    .from('catalogo_produtos')
    .select('id,clinica_id,nome,preco,preco_sob_consulta,sinal_percentual,ativo,agenda_horarios,exigir_data_agendamento,cupom_codigo,cupom_tipo,cupom_valor,cupom_ativo,cupom_validade,cupom_limite_usos,cupom_usos')
    .eq('id', produtoId)
    .eq('clinica_id', clinicaId)
    .eq('ativo', true)
    .maybeSingle();

  if (!produto) return NextResponse.json({ error: 'Produto não encontrado.' }, { status: 404 });
  if (produto.preco_sob_consulta) {
    return NextResponse.json({ error: 'Este produto possui preço sob consulta. Fale com a clínica pelo WhatsApp.' }, { status: 400 });
  }

  const exigeData = produto.exigir_data_agendamento !== false;
  if (exigeData) {
    if (!dataPreferida) {
      return NextResponse.json({ error: 'Selecione uma data disponível.' }, { status: 400 });
    }

    const horarios = horariosDoDia(dataPreferida, produto.agenda_horarios);
    if (!horarios.length) {
      return NextResponse.json({ error: 'Esta data não possui horários disponíveis para este produto.' }, { status: 400 });
    }

    if (!horarioPreferido || !horarios.includes(String(horarioPreferido))) {
      return NextResponse.json({ error: 'Horário indisponível para este produto.' }, { status: 400 });
    }

    const { data: existente } = await admin
      .from('catalogo_agendamentos')
      .select('id')
      .eq('catalogo_produto_id', produtoId)
      .eq('data_preferida', dataPreferida)
      .eq('horario_preferido', horarioPreferido)
      .in('status', ['aguardando_pagamento', 'pagamento_recebido', 'confirmado'])
      .maybeSingle();

    if (existente) {
      return NextResponse.json({ error: 'Este horário acabou de ser reservado. Escolha outro horário.' }, { status: 409 });
    }
  }

  const preco = Number(produto.preco ?? 0);
  const percentual = Number(produto.sinal_percentual ?? 0);
  const valorOriginalSinal = Number.isFinite(preco) && Number.isFinite(percentual) ? Number((preco * percentual / 100).toFixed(2)) : 0;
  const cupom = calcularCupom(produto, cupomCodigo, valorOriginalSinal);
  if (cupomCodigo && !cupom.valido) {
    return NextResponse.json({ error: cupom.mensagem ?? 'Cupom inválido.' }, { status: 400 });
  }
  const valorSinal = Math.max(0, Number((valorOriginalSinal - cupom.desconto).toFixed(2)));

  if (valorSinal <= 0) {
    return NextResponse.json({ error: 'Este produto precisa ter preço e percentual de sinal para permitir pagamento online.' }, { status: 400 });
  }

  const { data: agendamento, error } = await admin.from('catalogo_agendamentos').insert({
    clinica_id: clinicaId,
    catalogo_produto_id: produtoId,
    produto_nome: produto.nome,
    cliente_nome: nome.trim(),
    cliente_email: email?.trim() || null,
    cliente_telefone: telefone.trim(),
    data_preferida: exigeData ? dataPreferida : null,
    periodo_preferido: null,
    horario_preferido: exigeData ? horarioPreferido : null,
    observacoes: observacoes?.trim() || null,
    preco_total: Number.isFinite(preco) ? preco : null,
    sinal_percentual: percentual,
    valor_original_sinal: valorOriginalSinal,
    desconto_valor: cupom.desconto,
    cupom_codigo: cupom.codigo,
    valor_sinal: valorSinal,
    status: 'aguardando_pagamento',
    expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  }).select('*').single();

  if (error) {
    const mensagem = String(error.message ?? '');
    if (error.code === '23505' || mensagem.includes('idx_catalogo_agendamento_horario_unico')) {
      return NextResponse.json({ error: 'Este horário acabou de ser reservado. Escolha outro horário.' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const paymentUrl = await criarPreferenciaMercadoPago(req, agendamento, exigeData);
  if (paymentUrl?.preferenceId || paymentUrl?.url) {
    await admin.from('catalogo_agendamentos').update({
      mercado_pago_preference_id: paymentUrl.preferenceId ?? null,
      pagamento_url: paymentUrl.url ?? null,
    }).eq('id', agendamento.id);
  }
  if (cupom.codigo) {
    await admin
      .from('catalogo_produtos')
      .update({ cupom_usos: Number(produto.cupom_usos ?? 0) + 1 })
      .eq('id', produto.id);
  }

  return NextResponse.json({ data: agendamento, paymentUrl: paymentUrl?.url ?? null });
}

async function criarPreferenciaMercadoPago(req: NextRequest, agendamento: any, exigeData: boolean) {
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!token) return null;

  const origin = PUBLIC_APP_ORIGIN;
  const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      external_reference: agendamento.id,
      notification_url: origin ? `${origin}/api/catalogo/mercado-pago/webhook` : undefined,
      back_urls: origin ? {
        success: `${origin}/catalogo/agendamento/${agendamento.id}?status=success`,
        pending: `${origin}/catalogo/agendamento/${agendamento.id}?status=pending`,
        failure: `${origin}/catalogo/agendamento/${agendamento.id}?status=failure`,
      } : undefined,
      auto_return: 'approved',
      items: [{
        id: agendamento.id,
        title: `${exigeData ? 'Sinal' : 'Pagamento'} - ${agendamento.produto_nome}`,
        quantity: 1,
        currency_id: 'BRL',
        unit_price: Number(agendamento.valor_sinal),
      }],
      payer: {
        name: agendamento.cliente_nome,
        email: agendamento.cliente_email || undefined,
      },
    }),
  });

  if (!response.ok) return null;
  const data = await response.json();
  return { url: data.init_point || data.sandbox_init_point, preferenceId: data.id };
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

function calcularCupom(produto: any, codigoInformado: unknown, valorOriginal: number) {
  const codigo = String(codigoInformado ?? '').trim().toUpperCase();
  if (!codigo) return { valido: true, desconto: 0, codigo: null as string | null };
  const esperado = String(produto.cupom_codigo ?? '').trim().toUpperCase();
  if (!produto.cupom_ativo || !esperado || codigo !== esperado) {
    return { valido: false, desconto: 0, codigo: null as string | null, mensagem: 'Cupom inválido ou inativo.' };
  }
  if (produto.cupom_validade && String(produto.cupom_validade) < new Date().toISOString().slice(0, 10)) {
    return { valido: false, desconto: 0, codigo: null as string | null, mensagem: 'Cupom expirado.' };
  }
  if (produto.cupom_limite_usos != null && Number(produto.cupom_usos ?? 0) >= Number(produto.cupom_limite_usos)) {
    return { valido: false, desconto: 0, codigo: null as string | null, mensagem: 'Cupom atingiu o limite de usos.' };
  }
  const valor = Number(produto.cupom_valor ?? 0);
  const desconto = produto.cupom_tipo === 'valor' ? valor : valorOriginal * valor / 100;
  return { valido: true, desconto: Math.min(valorOriginal, Number(desconto.toFixed(2))), codigo };
}
