import { resolverPercentualGordura } from '@/lib/bodyComposition';
import { type AvaliacaoHidratada, consolidarHistorico } from '@/lib/historico';

type EvolutionReportData = {
  clinica?: {
    nome?: string | null;
    logo_url?: string | null;
    cor_primaria?: string | null;
    telefone?: string | null;
    email?: string | null;
  } | null;
  paciente: {
    nome: string;
    cpf?: string | null;
    sexo?: string | null;
    idade?: number | null;
  };
  avaliador?: {
    nome?: string | null;
    conselho?: string | null;
  } | null;
  avaliacoes: AvaliacaoHidratada[];
  analiseEvolucao?: any;
};

const esc = (value: any) => value == null
  ? ''
  : String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const num = (value: any): number | null => {
  if (value == null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const dateBR = (value?: string | null) => {
  if (!value) return '—';
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('pt-BR');
};

const format = (value: any, digits = 1, unit = '') => {
  const parsed = num(value);
  if (parsed == null) return '—';
  return `${parsed.toLocaleString('pt-BR', { maximumFractionDigits: digits, minimumFractionDigits: digits })}${unit ? ` ${unit}` : ''}`;
};

function massaMagra(avaliacao: any) {
  return num(avaliacao?.antropometria?.massa_magra)
    ?? num(avaliacao?.bioimpedancia?.massa_livre_gordura_kg)
    ?? num(avaliacao?.bioimpedancia?.massa_magra_kg);
}

function peso(avaliacao: any) {
  return num(avaliacao?.antropometria?.peso) ?? num(avaliacao?.bioimpedancia?.peso_kg);
}

function ffmi(avaliacao: any) {
  const direto = num(avaliacao?.antropometria?.ffmi) ?? num(avaliacao?.bioimpedancia?.ffmi);
  if (direto != null) return direto;
  const massa = massaMagra(avaliacao);
  const altura = num(avaliacao?.antropometria?.altura) ?? num(avaliacao?.bioimpedancia?.altura_cm);
  return massa != null && altura != null && altura > 0 ? massa / Math.pow(altura / 100, 2) : null;
}

function gordura(avaliacao: any) {
  return resolverPercentualGordura(avaliacao, avaliacao?.antropometria, avaliacao?.bioimpedancia).valor;
}

function fotoPostural(avaliacao: any) {
  const postura = avaliacao?.posturografia ?? {};
  return postura.foto_anterior || postura.foto_posterior || postura.foto_lateral_dir || postura.foto_lateral_esq || null;
}

function delta(atual: any, anterior: any, digits = 1, lowerIsBetter = false) {
  const a = num(atual);
  const b = num(anterior);
  if (a == null || b == null) return { text: '—', color: '#94a3b8', background: '#f8fafc' };
  const diff = +(a - b).toFixed(digits);
  const positive = lowerIsBetter ? diff < 0 : diff > 0;
  const neutral = diff === 0;
  return {
    text: `${diff > 0 ? '+' : ''}${diff.toLocaleString('pt-BR', { maximumFractionDigits: digits, minimumFractionDigits: digits })}`,
    color: neutral ? '#64748b' : positive ? '#059669' : '#dc2626',
    background: neutral ? '#f1f5f9' : positive ? '#ecfdf5' : '#fef2f2',
  };
}

function textoAnalise(analise: any) {
  if (!analise) return '';
  if (typeof analise === 'string') return analise;
  return analise.texto_paciente_editado
    || analise.texto_editado
    || analise.conteudo_paciente?.interpretacao
    || analise.conteudo_paciente?.resumo
    || analise.conteudo?.interpretacao
    || analise.conteudo?.resumo_executivo
    || analise.interpretacao
    || '';
}

function dividirTexto(texto: string, limite = 2200) {
  const blocos = String(texto || '').split(/\n{2,}/).map(item => item.trim()).filter(Boolean);
  const paragrafos = blocos.flatMap(bloco => {
    if (bloco.length <= limite) return [bloco];
    const partes: string[] = [];
    let atual = '';
    for (const frase of bloco.match(/[^.!?]+[.!?]+|\S.+$/g) || [bloco]) {
      const proximo = atual ? `${atual} ${frase.trim()}` : frase.trim();
      if (proximo.length <= limite) atual = proximo;
      else {
        if (atual) partes.push(atual);
        atual = frase.trim();
      }
    }
    if (atual) partes.push(atual);
    return partes;
  });
  const paginas: string[] = [];
  let atual = '';
  for (const paragrafo of paragrafos) {
    if (!atual || `${atual}\n\n${paragrafo}`.length <= limite) {
      atual = atual ? `${atual}\n\n${paragrafo}` : paragrafo;
    } else {
      paginas.push(atual);
      atual = paragrafo;
    }
  }
  if (atual) paginas.push(atual);
  return paginas;
}

export function renderEvolutionReportHTML(data: EvolutionReportData) {
  const historico = consolidarHistorico(data.avaliacoes);
  const atual = historico.ultima;
  const anterior = historico.penultima;
  if (!atual || !anterior) throw new Error('São necessárias ao menos duas avaliações finalizadas');

  const primary = data.clinica?.cor_primaria || '#059669';
  const metrics = [
    { group: 'Resultado', label: 'Score global', before: anterior.scores?.global, after: atual.scores?.global, digits: 0 },
    { group: 'Composição', label: 'Peso corporal', before: peso(anterior), after: peso(atual), digits: 1, unit: 'kg', lowerIsBetter: false },
    { group: 'Composição', label: 'Gordura corporal', before: gordura(anterior), after: gordura(atual), digits: 1, unit: '%', lowerIsBetter: true },
    { group: 'Composição', label: 'Massa magra', before: massaMagra(anterior), after: massaMagra(atual), digits: 1, unit: 'kg' },
    { group: 'Composição', label: 'FFMI', before: ffmi(anterior), after: ffmi(atual), digits: 1 },
    { group: 'Capacidade', label: 'Score de força', before: anterior.scores?.forca, after: atual.scores?.forca, digits: 0 },
    { group: 'Capacidade', label: 'Flexibilidade', before: anterior.scores?.flexibilidade, after: atual.scores?.flexibilidade, digits: 0 },
    { group: 'Capacidade', label: 'Score RML', before: anterior.scores?.rml, after: atual.scores?.rml, digits: 0 },
    { group: 'Cardio', label: 'Score cardiorrespiratório', before: anterior.scores?.cardiorrespiratorio, after: atual.scores?.cardiorrespiratorio, digits: 0 },
    { group: 'Cardio', label: 'VO₂máx', before: anterior.cardiorrespiratorio?.vo2max, after: atual.cardiorrespiratorio?.vo2max, digits: 1, unit: 'ml/kg/min' },
  ];
  const scoreSeries = [
    ['Global', 'global'],
    ['Postura', 'postura'],
    ['Composição', 'composicao_corporal'],
    ['Força', 'forca'],
    ['Flexibilidade', 'flexibilidade'],
    ['RML', 'rml'],
    ['Cardio', 'cardiorrespiratorio'],
  ];
  const analysis = textoAnalise(data.analiseEvolucao);
  const analysisPages = dividirTexto(analysis);
  const photoBefore = fotoPostural(anterior);
  const photoAfter = fotoPostural(atual);

  const metricCards = metrics.map(metric => {
    const change = delta(metric.after, metric.before, metric.digits, metric.lowerIsBetter);
    return `<div class="metric">
      <div class="eyebrow">${esc(metric.group)}</div>
      <div class="metric-title">${esc(metric.label)}</div>
      <div class="comparison">
        <div><span>Antes</span><strong>${format(metric.before, metric.digits, metric.unit)}</strong></div>
        <div class="arrow">→</div>
        <div><span>Atual</span><strong>${format(metric.after, metric.digits, metric.unit)}</strong></div>
      </div>
      <div class="delta" style="color:${change.color};background:${change.background}">${change.text}</div>
    </div>`;
  }).join('');

  const scoreRows = scoreSeries.map(([label, key]) => {
    const before = num(anterior.scores?.[key]);
    const after = num(atual.scores?.[key]);
    if (before == null && after == null) return '';
    const change = delta(after, before, 0);
    return `<div class="score-row">
      <div class="score-label">${esc(label)}</div>
      <div class="score-track"><div class="score-before" style="width:${Math.max(0, Math.min(100, before ?? 0))}%"></div></div>
      <div class="score-value">${before ?? '—'}</div>
      <div class="score-track"><div class="score-after" style="width:${Math.max(0, Math.min(100, after ?? 0))}%"></div></div>
      <div class="score-value">${after ?? '—'}</div>
      <div class="score-delta" style="color:${change.color}">${change.text}</div>
    </div>`;
  }).join('');

  const timelineRows = historico.ordenadas.map(avaliacao => `<tr>
    <td>${dateBR(avaliacao.data)}</td>
    <td>${esc(avaliacao.tipo || 'Avaliação')}</td>
    <td>${format(avaliacao.scores?.global, 0)}</td>
    <td>${format(peso(avaliacao), 1, 'kg')}</td>
    <td>${format(gordura(avaliacao), 1, '%')}</td>
    <td>${format(massaMagra(avaliacao), 1, 'kg')}</td>
    <td>${format(avaliacao.cardiorrespiratorio?.vo2max, 1)}</td>
  </tr>`).join('');

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8"/>
  <style>
    @page { size:A4; margin:0; }
    * { box-sizing:border-box; }
    body { margin:0; width:210mm; font-family:Arial,Helvetica,sans-serif; color:#0f172a; background:#fff; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    .page { width:210mm; min-height:297mm; padding:18mm 16mm 20mm; page-break-after:always; position:relative; overflow:hidden; }
    .page:last-child { page-break-after:auto; }
    .cover { color:#fff; background:linear-gradient(145deg,#0f172a,${primary}); display:flex; flex-direction:column; justify-content:space-between; }
    .brand { display:flex; align-items:center; gap:14px; }
    .logo { width:58px; height:58px; object-fit:contain; border-radius:14px; background:#fff; padding:7px; }
    .brand-name { font-size:18px; font-weight:800; }
    .cover-main { margin:auto 0; max-width:150mm; }
    .cover-kicker,.eyebrow { font-size:9px; font-weight:800; text-transform:uppercase; letter-spacing:1.5px; color:${primary}; }
    .cover-kicker { color:#bbf7d0; margin-bottom:12px; }
    h1 { font-size:38px; line-height:1.05; margin:0 0 14px; }
    .cover-sub { font-size:16px; line-height:1.55; color:#dbeafe; }
    .cover-dates { display:grid; grid-template-columns:1fr auto 1fr; gap:14px; align-items:center; margin-top:36px; }
    .date-card { border:1px solid rgba(255,255,255,.25); border-radius:16px; padding:16px; background:rgba(255,255,255,.09); }
    .date-card span { display:block; font-size:9px; text-transform:uppercase; letter-spacing:1px; opacity:.7; }
    .date-card strong { display:block; margin-top:6px; font-size:19px; }
    .cover-footer { border-top:1px solid rgba(255,255,255,.2); padding-top:16px; font-size:11px; color:#dbeafe; display:flex; justify-content:space-between; }
    .header { display:flex; justify-content:space-between; align-items:flex-end; padding-bottom:12px; border-bottom:2px solid ${primary}; margin-bottom:18px; }
    .header h2 { margin:0; font-size:24px; }
    .header p { margin:5px 0 0; color:#64748b; font-size:11px; }
    .period { font-size:11px; font-weight:700; color:${primary}; }
    .metrics { display:grid; grid-template-columns:repeat(2,1fr); gap:10px; }
    .metric { border:1px solid #dbe4ea; border-radius:14px; padding:13px; break-inside:avoid; }
    .metric-title { font-size:13px; font-weight:800; margin:5px 0 11px; }
    .comparison { display:grid; grid-template-columns:1fr auto 1fr; gap:8px; align-items:center; }
    .comparison span { display:block; font-size:8px; text-transform:uppercase; color:#94a3b8; font-weight:700; }
    .comparison strong { display:block; font-size:16px; margin-top:3px; }
    .arrow { color:#94a3b8; }
    .delta { width:max-content; margin-top:10px; border-radius:999px; padding:4px 9px; font-size:10px; font-weight:800; }
    .score-head,.score-row { display:grid; grid-template-columns:24mm 1fr 10mm 1fr 10mm 13mm; gap:7px; align-items:center; }
    .score-head { font-size:8px; color:#94a3b8; font-weight:800; text-transform:uppercase; margin-bottom:8px; }
    .score-row { padding:9px 0; border-top:1px solid #edf2f7; }
    .score-label { font-size:11px; font-weight:700; }
    .score-track { height:8px; background:#e2e8f0; border-radius:999px; overflow:hidden; }
    .score-before { height:100%; background:#94a3b8; }
    .score-after { height:100%; background:${primary}; }
    .score-value,.score-delta { font-size:10px; font-weight:800; text-align:right; }
    .analysis { border-left:4px solid ${primary}; background:#ecfdf5; border-radius:0 12px 12px 0; padding:15px 17px; font-size:12px; line-height:1.65; white-space:pre-line; overflow-wrap:anywhere; }
    .photos { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
    .photo { border:1px solid #dbe4ea; border-radius:14px; padding:10px; }
    .photo h3 { font-size:11px; margin:0 0 8px; }
    .photo img { width:100%; height:150mm; object-fit:contain; background:#f8fafc; border-radius:10px; }
    table { width:100%; border-collapse:collapse; font-size:10px; }
    th { padding:9px 7px; background:#f1f5f9; color:#64748b; text-align:left; text-transform:uppercase; font-size:8px; }
    td { padding:9px 7px; border-bottom:1px solid #e2e8f0; }
    .legend { display:flex; gap:18px; margin:12px 0 18px; font-size:10px; color:#64748b; }
    .dot { display:inline-block; width:9px; height:9px; border-radius:50%; margin-right:5px; }
    .footer { position:absolute; left:16mm; right:16mm; bottom:9mm; border-top:1px solid #e2e8f0; padding-top:6px; font-size:8px; color:#94a3b8; display:flex; justify-content:space-between; }
  </style>
</head>
<body>
  <section class="page cover">
    <div class="brand">
      ${data.clinica?.logo_url ? `<img class="logo" src="${esc(data.clinica.logo_url)}"/>` : ''}
      <div class="brand-name">${esc(data.clinica?.nome || 'Diagnóstico Fisiometabólico')}</div>
    </div>
    <div class="cover-main">
      <div class="cover-kicker">Relatório comparativo</div>
      <h1>Evolução fisiometabólica</h1>
      <div class="cover-sub">${esc(data.paciente.nome)}<br/>Comparação objetiva dos resultados, composição corporal e capacidades físicas.</div>
      <div class="cover-dates">
        <div class="date-card"><span>Avaliação anterior</span><strong>${dateBR(anterior.data)}</strong></div>
        <div>→</div>
        <div class="date-card"><span>Avaliação atual</span><strong>${dateBR(atual.data)}</strong></div>
      </div>
    </div>
    <div class="cover-footer">
      <span>${esc(data.avaliador?.nome || 'Profissional responsável')}${data.avaliador?.conselho ? ` · ${esc(data.avaliador.conselho)}` : ''}</span>
      <span>${historico.ordenadas.length} avaliações finalizadas</span>
    </div>
  </section>

  <section class="page">
    <div class="header"><div><h2>Comparativo principal</h2><p>Variação entre as duas avaliações mais recentes.</p></div><div class="period">${dateBR(anterior.data)} → ${dateBR(atual.data)}</div></div>
    <div class="metrics">${metricCards}</div>
    <div class="footer"><span>${esc(data.clinica?.nome || '')} · ${esc(data.paciente.nome)}</span><span>Relatório de evolução</span></div>
  </section>

  ${analysisPages.map((parte, index) => `<section class="page">
    <div class="header"><div><h2>Leitura da evolução${index ? ' (continuação)' : ''}</h2><p>Texto revisado e aprovado pelo profissional responsável.</p></div><div class="period">${dateBR(anterior.data)} → ${dateBR(atual.data)}</div></div>
    <div class="analysis">${esc(parte)}</div>
    <div class="footer"><span>${esc(data.clinica?.nome || '')} · ${esc(data.paciente.nome)}</span><span>Relatório de evolução</span></div>
  </section>`).join('')}

  <section class="page">
    <div class="header"><div><h2>Evolução dos scores</h2><p>Escala de 0 a 100 por domínio avaliado.</p></div><div class="period">${dateBR(anterior.data)} → ${dateBR(atual.data)}</div></div>
    <div class="score-head"><div>Domínio</div><div>Anterior</div><div></div><div>Atual</div><div></div><div>Delta</div></div>
    ${scoreRows}
    <div class="legend"><span><i class="dot" style="background:#94a3b8"></i>Avaliação anterior</span><span><i class="dot" style="background:${primary}"></i>Avaliação atual</span></div>
    <div class="header" style="margin-top:28px"><div><h2 style="font-size:19px">Linha do tempo</h2><p>Todas as avaliações finalizadas disponíveis.</p></div></div>
    <table><thead><tr><th>Data</th><th>Tipo</th><th>Global</th><th>Peso</th><th>Gordura</th><th>Massa magra</th><th>VO₂máx</th></tr></thead><tbody>${timelineRows}</tbody></table>
    <div class="footer"><span>${esc(data.clinica?.nome || '')} · ${esc(data.paciente.nome)}</span><span>Histórico longitudinal</span></div>
  </section>

  ${(photoBefore || photoAfter) ? `<section class="page">
    <div class="header"><div><h2>Comparativo postural</h2><p>Registro visual das avaliações mais recentes.</p></div><div class="period">${dateBR(anterior.data)} → ${dateBR(atual.data)}</div></div>
    <div class="photos">
      <div class="photo"><h3>Anterior · ${dateBR(anterior.data)}</h3>${photoBefore ? `<img src="${esc(photoBefore)}"/>` : '<div>Sem fotografia</div>'}</div>
      <div class="photo"><h3>Atual · ${dateBR(atual.data)}</h3>${photoAfter ? `<img src="${esc(photoAfter)}"/>` : '<div>Sem fotografia</div>'}</div>
    </div>
    <div class="footer"><span>${esc(data.clinica?.nome || '')} · ${esc(data.paciente.nome)}</span><span>Comparativo postural</span></div>
  </section>` : ''}
</body>
</html>`;
}
