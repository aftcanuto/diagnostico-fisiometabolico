import { createHash } from 'crypto';
import { launchPdfBrowser } from '@/lib/pdf/browser';

export const DECLARACAO_ACEITE_AVULSO =
  'Li integralmente o termo apresentado, compreendi seu conteudo e confirmo meu consentimento de forma livre e expressa.';

export type EvidenciaAvulsa = {
  id: string;
  documento_id: string;
  clinica_id: string;
  modelo_id?: string | null;
  modelo_nome: string;
  modelo_tipo: string;
  texto_versao: number;
  texto_aceito: string;
  texto_html_aceito?: string | null;
  declaracao_aceite: string;
  signatario_nome?: string | null;
  signatario_cpf_hash?: string | null;
  signatario_cpf_final?: string | null;
  destinatario_nome?: string | null;
  aceito_em: string;
  ip?: string | null;
  user_agent?: string | null;
  conteudo_hash: string;
  evidencia_hash: string;
  comprovante_codigo: string;
  nivel_evidencia: 'completo' | 'parcial_legado';
  observacao_evidencia?: string | null;
  pdf_path?: string | null;
  pdf_hash?: string | null;
  revogado?: boolean | null;
  revogado_em?: string | null;
  motivo_revogacao?: string | null;
};

export function sha256(value: string | Buffer) {
  return createHash('sha256').update(value).digest('hex');
}

export function normalizarCpf(value: unknown) {
  return String(value ?? '').replace(/\D/g, '');
}

export function cpfValido(value: unknown) {
  const cpf = normalizarCpf(value);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

  const digito = (base: string, pesoInicial: number) => {
    const soma = [...base].reduce((total, numero, index) => (
      total + Number(numero) * (pesoInicial - index)
    ), 0);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };

  return digito(cpf.slice(0, 9), 10) === Number(cpf[9])
    && digito(cpf.slice(0, 10), 11) === Number(cpf[10]);
}

export function hashConteudo(modelo: {
  nome?: unknown;
  tipo?: unknown;
  versao?: unknown;
  texto?: unknown;
  texto_html?: unknown;
}) {
  return sha256(JSON.stringify({
    nome: String(modelo.nome ?? ''),
    tipo: String(modelo.tipo ?? ''),
    versao: Number(modelo.versao ?? 1),
    texto: String(modelo.texto ?? ''),
    texto_html: String(modelo.texto_html ?? ''),
  }));
}

export function hashEvidencia(payload: Record<string, unknown>) {
  return sha256(JSON.stringify(payload));
}

export async function gerarPdfEvidenciaAvulsa(
  aceite: EvidenciaAvulsa,
  clinica: Record<string, unknown> | null,
) {
  const browser = await launchPdfBrowser();
  try {
    const page = await browser.newPage();
    await page.setContent(htmlComprovanteAvulso(aceite, clinica), { waitUntil: 'networkidle0' });
    return Buffer.from(await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
    }));
  } finally {
    await browser.close();
  }
}

function htmlComprovanteAvulso(
  aceite: EvidenciaAvulsa,
  clinica: Record<string, unknown> | null,
) {
  const parcial = aceite.nivel_evidencia === 'parcial_legado';
  const cpf = aceite.signatario_cpf_final
    ? `***.***.***-${aceite.signatario_cpf_final}`
    : 'Nao coletado';
  const revogacao = aceite.revogado
    ? `<section class="notice warning"><strong>Revogacao registrada</strong><br>${escapeHtml(formatarData(aceite.revogado_em))}${aceite.motivo_revogacao ? ` - ${escapeHtml(aceite.motivo_revogacao)}` : ''}</section>`
    : '';
  const observacao = parcial
    ? `<section class="notice"><strong>Evidencia parcial de registro anterior</strong><br>${escapeHtml(aceite.observacao_evidencia ?? 'Alguns dados tecnicos nao estavam disponiveis no fluxo anterior.')}</section>`
    : '';

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 30px; font-family: Arial, sans-serif; color: #172033; background: #f5f7f8; }
    main { min-height: 1015px; border: 1px solid #dbe3e7; border-radius: 16px; background: white; padding: 32px; }
    .eyebrow { color: #13795b; font-size: 10px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; }
    h1 { margin: 8px 0 5px; font-size: 27px; line-height: 1.15; }
    .subtitle { margin: 0; color: #687386; font-size: 12px; line-height: 1.5; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 9px; margin: 20px 0; }
    .card { min-height: 62px; border: 1px solid #e2e8ec; border-radius: 9px; background: #f8fafb; padding: 11px 12px; }
    .label { color: #687386; font-size: 8px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; }
    .value { margin-top: 5px; font-size: 12px; font-weight: 700; line-height: 1.4; overflow-wrap: anywhere; }
    .hash { font-family: Consolas, monospace; font-size: 9px; font-weight: 500; }
    .notice { margin: 14px 0; border: 1px solid #f0cf88; border-radius: 9px; background: #fff8e8; padding: 11px 13px; color: #684b10; font-size: 10px; line-height: 1.5; }
    .warning { border-color: #e9a7a7; background: #fff1f1; color: #812727; }
    .declaration, .term { margin-top: 17px; border: 1px solid #e2e8ec; border-radius: 9px; padding: 14px; font-size: 11px; line-height: 1.6; white-space: pre-wrap; }
    .declaration { border-left: 4px solid #1d9e75; background: #eef9f5; }
    .term { background: #f8fafb; }
    footer { margin-top: 20px; border-top: 1px solid #e2e8ec; padding-top: 12px; color: #84909f; font-size: 9px; display: flex; justify-content: space-between; gap: 16px; }
  </style>
</head>
<body>
  <main>
    <div class="eyebrow">Comprovante de consentimento digital</div>
    <h1>${escapeHtml(aceite.modelo_nome)}</h1>
    <p class="subtitle">Registro tecnico de autoria declarada, integridade do conteudo e manifestacao de vontade.</p>
    <div class="grid">
      ${card('Codigo', aceite.comprovante_codigo)}
      ${card('Aceito em', formatarData(aceite.aceito_em))}
      ${card('Signatario', aceite.signatario_nome ?? aceite.destinatario_nome ?? 'Nao informado')}
      ${card('CPF informado', cpf)}
      ${card('Clinica', clinica?.nome ?? 'Nao informada')}
      ${card('Documento', `${aceite.modelo_tipo.toUpperCase()} - versao ${aceite.texto_versao}`)}
      ${card('IP registrado', aceite.ip ?? 'Nao coletado')}
      ${card('Dispositivo/navegador', aceite.user_agent ?? 'Nao coletado')}
      ${card('Hash do conteudo', aceite.conteudo_hash, true, true)}
      ${card('Hash da evidencia', aceite.evidencia_hash, true, true)}
    </div>
    ${observacao}
    ${revogacao}
    <div class="label">Declaracao confirmada</div>
    <div class="declaration">${escapeHtml(aceite.declaracao_aceite)}</div>
    <div class="label" style="margin-top:18px">Texto aceito</div>
    <div class="term">${escapeHtml(aceite.texto_aceito)}</div>
    <footer>
      <span>${escapeHtml(clinica?.nome ?? 'Diagnostico Fisiometabolico')}</span>
      <span>PDF gerado em ${escapeHtml(formatarData(new Date().toISOString()))}</span>
    </footer>
  </main>
</body>
</html>`;
}

function card(label: string, value: unknown, wide = false, hash = false) {
  return `<div class="card"${wide ? ' style="grid-column:1/-1"' : ''}><div class="label">${escapeHtml(label)}</div><div class="value${hash ? ' hash' : ''}">${escapeHtml(value)}</div></div>`;
}

function formatarData(value?: string | null) {
  if (!value) return 'Nao informado';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Nao informado';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'medium',
    timeZone: 'America/Sao_Paulo',
  }).format(date);
}

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
