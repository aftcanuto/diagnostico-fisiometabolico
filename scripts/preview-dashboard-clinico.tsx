import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PatientDashboard } from '../src/components/PatientDashboard';
import { avaliacaoAnterior, avaliacaoAtual } from './preview-dashboard-cliente';

const html = renderToStaticMarkup(
  <PatientDashboard
    paciente={{
      nome: 'Marina Costa',
      sexo: 'F',
      data_nascimento: '1989-08-12',
      cpf: '000.000.000-00',
      email: 'marina@example.com',
    }}
    avaliador={{ nome: 'Dr. Rafael Almeida', conselho: 'CREF 000000-G/SP' }}
    avaliacoes={[avaliacaoAnterior, avaliacaoAtual]}
    pdfBaseUrl="/api/pdf?avaliacaoId="
    modo="clinico"
    quickEditAberto
  />
);

const doc = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Prévia - Dashboard Clínico</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: #eef3f2;
      color: #0f172a;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    button, select, input, textarea { font-family: inherit; }
    a { color: inherit; }
    .space-y-5 > * + * { margin-top: 20px; }
    .flex { display: flex; }
    .grid { display: grid; }
    .hidden { display: none; }
    .items-center { align-items: center; }
    .items-baseline { align-items: baseline; }
    .justify-between { justify-content: space-between; }
    .flex-col { flex-direction: column; }
    .flex-wrap { flex-wrap: wrap; }
    .flex-1 { flex: 1 1 0%; }
    .flex-shrink-0 { flex-shrink: 0; }
    .gap-1 { gap: 4px; }
    .gap-2 { gap: 8px; }
    .gap-4 { gap: 16px; }
    .gap-5 { gap: 20px; }
    .mt-0\\.5 { margin-top: 2px; }
    .mt-1 { margin-top: 4px; }
    .mt-3 { margin-top: 12px; }
    .mb-3 { margin-bottom: 12px; }
    .mb-4 { margin-bottom: 16px; }
    .mx-auto { margin-left: auto; margin-right: auto; }
    .w-3\\.5 { width: 14px; }
    .h-3\\.5 { height: 14px; }
    .w-4 { width: 16px; }
    .h-4 { height: 16px; }
    .w-5 { width: 20px; }
    .h-5 { height: 20px; }
    .w-12 { width: 48px; }
    .h-12 { height: 48px; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-xs { font-size: 12px; line-height: 16px; }
    .text-sm { font-size: 14px; line-height: 20px; }
    .text-lg { font-size: 18px; line-height: 28px; }
    .font-medium { font-weight: 500; }
    .font-semibold { font-weight: 600; }
    .font-bold { font-weight: 700; }
    .uppercase { text-transform: uppercase; }
    .tracking-wider { letter-spacing: .05em; }
    .rounded-lg { border-radius: 8px; }
    .rounded-xl { border-radius: 12px; }
    .border { border-width: 1px; border-style: solid; }
    .border-slate-100 { border-color: #f1f5f9; }
    .border-slate-200 { border-color: #e2e8f0; }
    .bg-white { background: #fff; }
    .bg-slate-50 { background: #f8fafc; }
    .text-slate-400 { color: #94a3b8; }
    .text-slate-500 { color: #64748b; }
    .text-slate-800 { color: #1e293b; }
    .p-3 { padding: 12px; }
    .py-16 { padding-top: 64px; padding-bottom: 64px; }
    .opacity-30 { opacity: .3; }
    .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
    @media (min-width: 768px) {
      .md\\:flex-row { flex-direction: row; }
      .md\\:items-center { align-items: center; }
      .md\\:justify-between { justify-content: space-between; }
    }
    @media (min-width: 1024px) {
      .lg\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .lg\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    }
  </style>
</head>
<body>
  <main style="max-width: 980px; margin: 0 auto; padding: 28px 20px 48px;">
    ${html}
  </main>
</body>
</html>`;

const out = resolve('preview-dashboard-clinico.html');
writeFileSync(out, doc, 'utf8');
console.log(out);
