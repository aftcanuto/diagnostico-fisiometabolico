import { JUMP_PROTOCOLS, jumpSchema, jumpSummary, jumpReference, jumpComparable, jumpProtocolTechnique, trialMetrics, trialWarnings } from '../jump-test';
const esc = (s: unknown) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fmt = (n: number | null | undefined) => n == null ? '-' : n.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
const table = (head: string[], rows: string[][]) => `<table style="width:100%;border-collapse:collapse;font-size:10px;table-layout:fixed"><thead><tr>${head.map((h, i) => `<th style="${i === 0 && h === 'Protocolo' ? 'width:28%;' : ''}padding:6px;text-align:left;border-bottom:1px solid #ccc;overflow-wrap:anywhere">${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${row.map(v => `<td style="padding:6px;border-bottom:1px solid #ddd;overflow-wrap:anywhere">${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
export function jumpEvolutionHtml(current: unknown, previous: unknown) {
  const a = jumpSchema.safeParse(current), b = jumpSchema.safeParse(previous);
  if (!a.success || !b.success) return '<p>Sem duas coletas de Jump Test disponiveis.</p>';
  const s = jumpSummary(a.data), old = jumpSummary(b.data);
  return table(['Protocolo', 'Anterior (cm)', 'Atual (cm)', 'Diferenca (cm)'], s.grupos.map(g => {
    const prev = old.grupos.find(p => p.protocolo === g.protocolo);
    const ok = s.pronto && old.pronto && g.completo && prev?.completo && jumpComparable(a.data, b.data, g.protocolo);
    return [JUMP_PROTOCOLS[g.protocolo], fmt(prev?.media_cm), fmt(g.media_cm), ok && prev?.media_cm != null && g.media_cm != null ? fmt(g.media_cm - prev.media_cm) : 'Nao comparavel'];
  })) + '<p style="font-size:10px;margin-top:12px">Medias das tentativas validas. Comparacao condicionada a protocolo, altura de queda, equipamento, software, tecnica de bracos, descanso e revisao. Variacao nao equivale a diagnostico de fadiga ou lesao.</p>';
}
export function jumpReportHtml(data: unknown, analysisHtml = '') {
  const parsed = jumpSchema.safeParse(data);
  if (!parsed.success) return '<section class="page module"><div class="mod-head"><h2 class="mod-title">Jump Test</h2></div><p class="module-intro">Os testes de salto avaliam potencia, capacidade explosiva, uso do ciclo alongamento-encurtamento e resposta reativa.</p><p>Sem coleta valida disponivel.</p></section>';
  const d = parsed.data, s = jumpSummary(d), ref = jumpReference(d);
  const page = (title: string, body: string) => `<section class="page module"><div class="mod-head"><h2 class="mod-title">${esc(title)}</h2></div>${title === 'Jump Test' ? '<p class="module-intro">Os testes de salto avaliam potencia, capacidade explosiva, uso do ciclo alongamento-encurtamento e resposta reativa por tempos de voo e contato.</p>' : ''}${body}</section>`;
  const protocolCards = s.grupos.map((g, index) => {
    const colors = ['#0f766e','#2563eb','#7c3aed','#b45309','#be123c'];
    const color = colors[index % colors.length];
    const secondary = g.rsi_medio != null ? `RSI ${fmt(g.rsi_medio)} m/s` : g.potencia_media_w != null ? `Pico medio ${fmt(g.potencia_media_w)} W` : `CV ${fmt(g.cv_percent)}%`;
    return `<div style="border:1px solid ${color}33;border-top:3px solid ${color};border-radius:8px;padding:9px 10px;background:#fff;min-height:82px">
      <div style="font-size:9px;font-weight:800;color:${color};text-transform:uppercase;letter-spacing:.4px">${esc(JUMP_PROTOCOLS[g.protocolo])}</div>
      <div style="font-size:21px;font-weight:900;color:#0f172a;line-height:1;margin-top:6px">${fmt(g.melhor_cm)} <span style="font-size:9px;color:#64748b">cm</span></div>
      <div style="font-size:8px;color:#64748b;margin-top:5px">Melhor · media ${fmt(g.media_cm)} cm</div>
      <div style="font-size:8px;font-weight:700;color:${color};margin-top:4px">${secondary}</div>
    </div>`;
  }).join('');
  const summary = `<style>.jump-trials th,.jump-trials td{padding:2px 5px!important;line-height:1.15}.jump-trials table{font-size:8.5px!important}</style><div data-jump-dashboard="true" style="margin-bottom:10px">
    <div style="font-size:11px;font-weight:800;color:#0f766e;text-transform:uppercase;letter-spacing:.8px;margin-bottom:5px">Resumo neuromuscular</div>
    <p style="font-size:9px;color:#64748b;line-height:1.35;margin:0 0 8px">Leitura rapida dos melhores saltos e indicadores centrais; as tentativas aparecem abaixo.</p>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-bottom:9px">${protocolCards}</div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:7px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:7px 10px">
      <div><span style="font-size:8px;color:#64748b;text-transform:uppercase">EUR altura</span><strong style="display:block;font-size:16px;color:#0f172a;margin-top:3px">${fmt(s.eur_altura)}</strong></div>
      <div><span style="font-size:8px;color:#64748b;text-transform:uppercase">EUR potencia</span><strong style="display:block;font-size:16px;color:#0f172a;margin-top:3px">${fmt(s.eur_potencia)}</strong></div>
      <div><span style="font-size:8px;color:#64748b;text-transform:uppercase">Assimetria</span><strong style="display:block;font-size:16px;color:#0f172a;margin-top:3px">${fmt(s.assimetria_altura_percent)}%</strong></div>
    </div>
  </div>
  <p style="font-size:10px;margin-bottom:8px">${esc(d.equipamento)} · ${esc(d.software)} · Massa ${fmt(d.peso_kg)} kg · DJ ${d.altura_queda_cm} cm · Repetidos 15 s · Descanso ${d.descanso_s} s</p>
    ${!s.pronto ? `<p style="font-size:11px;color:#92400e">Resultados parciais: ${esc(s.pendencias.join(' '))}</p>` : ''}
  <p style="font-size:8px;margin:4px 0 10px;line-height:1.3">EUR: VJ/SJ nas coletas atuais; CMJ/SJ apenas em coleta legada sem VJ. Assimetria: |D-E|/maior(D,E) x 100, CMJ unilateral. Sem classificacao de lesao.</p>
    ${ref ? `<div class="sec-sub">Referencia contextual</div><p style="font-size:10px">${esc(ref.label)}, n=${ref.n}, idade ${ref.idade_media} ± ${ref.idade_dp} anos. CMJ ${ref.media_cm} ± ${ref.dp_cm} cm (media ± DP). ${esc(ref.protocolo)}. ${esc(ref.fonte)}. ${esc(ref.limitacao)}<br/>Ressalvas do avaliador: ${esc(ref.justificativa)}</p>` : ''}
    `;
  const interpretation = `${d.observacoes ? `<div class="sec-sub">Condicoes e limitacoes</div><p style="font-size:11px;white-space:pre-wrap">${esc(d.observacoes)}</p>` : ''}
    ${d.conclusao ? `<div class="sec-sub">Conclusao profissional</div><p style="font-size:11px;white-space:pre-wrap">${esc(d.conclusao)}</p>` : ''}
    ${s.pronto ? analysisHtml : ''}`;
  const blocks: string[] = [];
  for (const p of d.protocolos) {
    const trials = d.tentativas.filter(t => t.protocolo === p);
    for (let offset = 0; offset < trials.length; offset += 8) {
      const slice = trials.slice(offset, offset + 8);
      const rows = slice.map((t, i) => { const m = trialMetrics(t, d.peso_kg); return [String(offset + i + 1), fmt(m.altura_cm), fmt(m.altura_mm), fmt(m.voo_ms), fmt(m.contato_ms), fmt(m.potencia_w), fmt(m.potencia_w_kg), fmt(m.rsi), t.status]; });
      const notes = slice.map((t, i) => {
        const metric = trialMetrics(t, d.peso_kg), details = [
          metric.origem_altura === 'estimada pelo tempo de voo' ? metric.origem_altura : '',
          t.justificativa,
          ...trialWarnings(t),
        ].filter(Boolean);
        return details.length ? `${offset + i + 1}: ${details.join('; ')}` : '';
      }).filter(Boolean).join('\n');
      blocks.push(`<div class="jump-trials" style="margin-top:8px;break-inside:avoid"><h3 style="font-size:12px;margin:0 0 2px">${esc(JUMP_PROTOCOLS[p])}${offset ? ' (continuacao)' : ''}</h3><p style="font-size:8px;margin:0 0 3px">Tecnica: ${esc(jumpProtocolTechnique(d, p))}.</p>` + table(['Salto', 'cm', 'mm', 'Voo ms', 'Contato ms', 'Pico W', 'W/kg', 'RSI m/s', 'Status'], rows) + (notes ? `<p style="font-size:8px;white-space:pre-wrap;margin-top:3px">${esc(notes)}</p>` : '') + '</div>');
    }
  }
  return page('Jump Test', summary + '<div class="sec-sub">Tentativas por protocolo</div>' + blocks.join('') + interpretation);
}
