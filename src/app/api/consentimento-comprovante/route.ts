import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { createAdminClient } from '@/lib/supabase/server';
import { launchPdfBrowser } from '@/lib/pdf/browser';

export const dynamic = 'force-dynamic';

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatDate(value?: string | null) {
  if (!value) return 'Nao informado';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Nao informado';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'medium',
    timeZone: 'America/Sao_Paulo',
  }).format(date);
}

function hashFallback(aceite: any) {
  if (aceite?.texto_hash) return aceite.texto_hash;
  return createHash('sha256')
    .update([
      aceite?.texto_aceito ?? '',
      aceite?.token ?? '',
      aceite?.aceito_em ?? '',
      aceite?.paciente_id ?? '',
    ].join('|'))
    .digest('hex');
}

function htmlComprovante(aceite: any, paciente: any, clinica: any) {
  const hash = hashFallback(aceite);
  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 34px; font-family: Arial, sans-serif; color: #0f172a; background: #f8fafc; }
    .page { background: #fff; border: 1px solid #dbe4ef; border-radius: 18px; padding: 34px; min-height: 1010px; }
    .eyebrow { color: #059669; font-size: 11px; font-weight: 800; letter-spacing: .16em; text-transform: uppercase; }
    h1 { margin: 8px 0 4px; font-size: 28px; line-height: 1.15; }
    .muted { color: #64748b; font-size: 12px; line-height: 1.55; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 22px 0; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 13px 14px; min-height: 66px; }
    .label { color: #64748b; font-size: 9px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
    .value { margin-top: 6px; font-size: 13px; font-weight: 700; word-break: break-word; line-height: 1.45; }
    .hash { font-family: Consolas, monospace; font-size: 10px; word-break: break-all; line-height: 1.5; }
    .term { margin-top: 22px; padding: 18px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; white-space: pre-wrap; font-size: 12px; line-height: 1.65; }
    .footer { margin-top: 24px; padding-top: 14px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; color: #94a3b8; font-size: 10px; }
  </style>
</head>
<body>
  <main class="page">
    <div class="eyebrow">Evidencia legal de aceite digital</div>
    <h1>Comprovante de aceite</h1>
    <p class="muted">Documento gerado automaticamente com dados tecnicos de rastreabilidade do aceite.</p>

    <div class="grid">
      <div class="card"><div class="label">Codigo</div><div class="value">${escapeHtml(aceite.comprovante_codigo ?? aceite.id)}</div></div>
      <div class="card"><div class="label">Data e hora</div><div class="value">${escapeHtml(formatDate(aceite.aceito_em))}</div></div>
      <div class="card"><div class="label">Paciente</div><div class="value">${escapeHtml(paciente?.nome)}</div></div>
      <div class="card"><div class="label">CPF</div><div class="value">${escapeHtml(paciente?.cpf || 'Nao informado')}</div></div>
      <div class="card"><div class="label">Clinica</div><div class="value">${escapeHtml(clinica?.nome)}</div></div>
      <div class="card"><div class="label">Termo</div><div class="value">${escapeHtml(aceite.modelo_nome)} v${escapeHtml(aceite.texto_versao ?? 1)}</div></div>
      <div class="card"><div class="label">IP registrado</div><div class="value">${escapeHtml(aceite.ip || 'Nao registrado')}</div></div>
      <div class="card"><div class="label">User-agent</div><div class="value">${escapeHtml(aceite.user_agent || 'Nao registrado')}</div></div>
      <div class="card" style="grid-column:1/-1"><div class="label">Hash SHA-256 do texto aceito</div><div class="value hash">${escapeHtml(hash)}</div></div>
    </div>

    <div class="label">Texto aceito</div>
    <div class="term">${escapeHtml(aceite.texto_aceito)}</div>

    <div class="footer">
      <span>${escapeHtml(clinica?.nome || 'Diagnostico Fisiometabolico')}</span>
      <span>Gerado em ${escapeHtml(formatDate(new Date().toISOString()))}</span>
    </div>
  </main>
</body>
</html>`;
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  if (!token) {
    return NextResponse.json({ error: 'Token obrigatorio' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: aceite, error } = await admin
    .from('consentimento_aceites')
    .select('*')
    .eq('token', token)
    .order('aceito_em', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !aceite) {
    return NextResponse.json({ error: 'Comprovante nao encontrado' }, { status: 404 });
  }

  const [{ data: paciente }, { data: clinica }] = await Promise.all([
    admin.from('pacientes').select('nome, cpf').eq('id', aceite.paciente_id).maybeSingle(),
    admin.from('clinicas').select('nome, cnpj, telefone, email, site, endereco').eq('id', aceite.clinica_id).maybeSingle(),
  ]);

  const browser = await launchPdfBrowser();
  try {
    const page = await browser.newPage();
    await page.setContent(htmlComprovante(aceite, paciente, clinica), { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
    });

    return new NextResponse(pdf as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="comprovante-aceite-${aceite.comprovante_codigo ?? aceite.id}.pdf"`,
        'Cache-Control': 'no-store',
      },
    });
  } finally {
    await browser.close();
  }
}
