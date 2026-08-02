import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const payload = await req.json().catch(() => ({}));
  const paymentId = payload?.data?.id || payload?.id || payload?.resource;
  if (paymentId) await atualizarPagamento(String(paymentId));
  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  const paymentId =
    req.nextUrl.searchParams.get('data.id')
    || req.nextUrl.searchParams.get('id')
    || req.nextUrl.searchParams.get('resource');
  if (paymentId) await atualizarPagamento(paymentId);
  return NextResponse.json({ ok: true });
}

async function atualizarPagamento(paymentId: string) {
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!token) return;

  const cleanId = paymentId.split('/').filter(Boolean).pop() ?? paymentId;
  const response = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(cleanId)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) return;

  const payment = await response.json();
  const agendamentoId = payment.external_reference;
  if (!agendamentoId) return;

  const status = statusInterno(payment.status);
  const admin = createAdminClient();
  await admin.from('catalogo_agendamentos').update({
    mercado_pago_payment_id: String(payment.id ?? cleanId),
    mercado_pago_status: payment.status ?? null,
    mercado_pago_status_detail: payment.status_detail ?? null,
    mercado_pago_raw: payment,
    mercado_pago_updated_at: new Date().toISOString(),
    status,
    pago_em: status === 'pagamento_recebido' ? new Date().toISOString() : null,
  }).eq('id', agendamentoId);
}

function statusInterno(status: string) {
  if (status === 'approved') return 'pagamento_recebido';
  if (['cancelled', 'rejected', 'refunded', 'charged_back'].includes(status)) return 'cancelado';
  if (status === 'expired') return 'expirado';
  return 'aguardando_pagamento';
}
