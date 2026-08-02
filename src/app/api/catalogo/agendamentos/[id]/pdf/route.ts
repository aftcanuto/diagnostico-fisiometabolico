import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { launchPdfBrowser } from '@/lib/pdf/browser';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(_: Request, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const admin = createAdminClient();
  const { data } = await admin
    .from('catalogo_agendamentos')
    .select('id,produto_nome,cliente_nome,cliente_email,cliente_telefone,status,preco_total,sinal_percentual,valor_original_sinal,desconto_valor,valor_sinal,cupom_codigo,data_preferida,horario_preferido,observacoes,pago_em,created_at,clinicas(nome,telefone,email,endereco,site),catalogo_produtos(politica_pagamento,pacote_itens)')
    .eq('id', id)
    .maybeSingle();

  if (!data) return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
  const clinica: any = Array.isArray(data.clinicas) ? data.clinicas[0] : data.clinicas;
  const produto: any = Array.isArray(data.catalogo_produtos) ? data.catalogo_produtos[0] : data.catalogo_produtos;
  const html = renderPedidoHtml(data, clinica, produto);
  const browser = await launchPdfBrowser();
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '18mm', right: '16mm', bottom: '18mm', left: '16mm' },
    });
    return new NextResponse(Buffer.from(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="pedido-${data.produto_nome.replace(/\s+/g, '_')}.pdf"`,
      },
    });
  } finally {
    await browser.close();
  }
}

function renderPedidoHtml(pedido: any, clinica: any, produto: any) {
  const pacote = Array.isArray(produto?.pacote_itens) ? produto.pacote_itens : [];
  return `<!doctype html>
  <html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <style>
      body{font-family:Arial,sans-serif;color:#0f172a;margin:0;background:#fff}
      .hero{background:linear-gradient(135deg,#047857,#0f766e);color:white;border-radius:22px;padding:28px;margin-bottom:22px}
      h1{margin:0;font-size:28px}.muted{color:#64748b}.card{border:1px solid #e2e8f0;border-radius:18px;padding:18px;margin:14px 0}
      .grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.label{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#94a3b8;font-weight:700}
      .value{font-size:16px;font-weight:700;margin-top:3px}.ok{color:#047857}.total{font-size:24px;color:#047857}
      ul{margin:8px 0 0 18px;padding:0}li{margin:5px 0}.footer{margin-top:26px;border-top:1px solid #e2e8f0;padding-top:14px;font-size:12px;color:#64748b}
    </style>
  </head>
  <body>
    <section class="hero">
      <div style="font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase">${x(clinica?.nome || 'MedFit')}</div>
      <h1>Resumo do pedido</h1>
      <p>Comprovante do produto contratado pela vitrine.</p>
    </section>
    <section class="card">
      <div class="grid">
        ${info('Produto', pedido.produto_nome)}
        ${info('Cliente', pedido.cliente_nome)}
        ${info('Telefone', pedido.cliente_telefone)}
        ${info('E-mail', pedido.cliente_email || '-')}
        ${info('Data', pedido.data_preferida ? formatarData(pedido.data_preferida) : 'A combinar')}
        ${info('Horário', pedido.horario_preferido || 'A combinar')}
        ${info('Status', statusLabel(pedido.status))}
        ${info('Pago em', pedido.pago_em ? formatarDataHora(pedido.pago_em) : '-')}
      </div>
    </section>
    <section class="card">
      <div class="grid">
        ${info('Preço total', moeda(pedido.preco_total))}
        ${info('% sinal', `${Number(pedido.sinal_percentual || 0)}%`)}
        ${info('Sinal original', moeda(pedido.valor_original_sinal ?? pedido.valor_sinal))}
        ${info('Cupom', pedido.cupom_codigo || '-')}
        ${info('Desconto', moeda(pedido.desconto_valor))}
        <div><div class="label">Valor pago</div><div class="value total">${moeda(pedido.valor_sinal)}</div></div>
      </div>
    </section>
    ${pacote.length ? `<section class="card"><div class="label">Pacote inclui</div><ul>${pacote.map((item: string) => `<li>${x(item)}</li>`).join('')}</ul></section>` : ''}
    ${pedido.observacoes ? `<section class="card"><div class="label">Observações</div><p>${x(pedido.observacoes)}</p></section>` : ''}
    ${produto?.politica_pagamento ? `<section class="card"><div class="label">Política</div><p>${x(produto.politica_pagamento)}</p></section>` : ''}
    <div class="footer">${[clinica?.nome, clinica?.telefone, clinica?.email, clinica?.site, clinica?.endereco].filter(Boolean).map(x).join(' · ')}</div>
  </body></html>`;
}

function info(label: string, value: any) {
  return `<div><div class="label">${x(label)}</div><div class="value">${x(value ?? '-')}</div></div>`;
}
function x(v: any) { return String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function moeda(v: any) { return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
function formatarData(data: string) { return new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo' }).format(new Date(`${data}T12:00:00`)); }
function formatarDataHora(data: string) { return new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' }).format(new Date(data)); }
function statusLabel(status: string) {
  return ({ aguardando_pagamento: 'Aguardando pagamento', pagamento_recebido: 'Pagamento recebido', confirmado: 'Confirmado', cancelado: 'Cancelado', expirado: 'Expirado' } as Record<string, string>)[status] ?? status;
}
