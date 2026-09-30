import { JUMP_PROTOCOLS, jumpSchema, jumpSummary, jumpReference, jumpComparable, trialMetrics, trialWarnings } from '../jump-test';
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
  })) + '<p style="font-size:10px;margin-top:12px">Medias das tentativas validas. Comparacao condicionada a protocolo, altura de queda, equipamento, software, bracos, descanso e revisao. Variacao nao equivale a diagnostico de fadiga ou lesao.</p>';
}
export function jumpReportHtml(data: unknown, analysisHtml = '') {
  const parsed = jumpSchema.safeParse(data);
  if (!parsed.success) return '<section class="page module"><div class="mod-head"><h2 class="mod-title">Jump Test</h2></div><p>Sem coleta valida disponivel.</p></section>';
  const d = parsed.data, s = jumpSummary(d), ref = jumpReference(d);
  const page = (title: string, body: string) => `<section class="page module"><div class="mod-head"><h2 class="mod-title">${esc(title)}</h2></div>${body}</section>`;
  const summary = `<p style="font-size:11px;margin-bottom:12px">${esc(d.equipamento)} · ${esc(d.software)} · Massa ${fmt(d.peso_kg)} kg · DJ ${d.altura_queda_cm} cm · Repetidos 15 s<br/>Bracos: ${esc(d.bracos)} · Descanso: ${d.descanso_s} s · Esporte: ${esc(d.esporte)} · Nivel: ${esc(d.nivel)}</p>
    ${!s.pronto ? `<p style="font-size:11px;color:#92400e">Resultados parciais: ${esc(s.pendencias.join(' '))}</p>` : ''}
    ${table(['Protocolo', 'Validos', 'Media cm', 'Melhor cm', 'CV %', 'Pico medio W', 'RSI m/s'], s.grupos.map(g => [JUMP_PROTOCOLS[g.protocolo], String(g.n), fmt(g.media_cm), fmt(g.melhor_cm), fmt(g.cv_percent), fmt(g.potencia_media_w), fmt(g.rsi_medio)]))}
    <p style="font-size:11px;margin-top:12px">EUR altura: ${fmt(s.eur_altura)} · EUR potencia: ${fmt(s.eur_potencia)}<br/>Assimetria de altura: ${fmt(s.assimetria_altura_percent)}% · Maior media: ${esc(s.lado_maior_altura ?? '-')}</p>
    <p style="font-size:10px;margin-top:8px">EUR: CMJ/SJ, medias de tres tentativas. Assimetria: |D-E|/maior(D,E) x 100, CMJ unilateral. Potencia: ${esc(d.metodo_potencia)}. Sem inferencia de forca bilateral independente ou classificacao de lesao.</p>
    ${ref ? `<div class="sec-sub">Referencia contextual</div><p style="font-size:10px">${esc(ref.label)}, n=${ref.n}, idade ${ref.idade_media} ± ${ref.idade_dp} anos. CMJ ${ref.media_cm} ± ${ref.dp_cm} cm (media ± DP). ${esc(ref.protocolo)}. ${esc(ref.fonte)}. ${esc(ref.limitacao)}<br/>Ressalvas do avaliador: ${esc(ref.justificativa)}</p>` : '<p style="font-size:10px;margin-top:10px">Sem referencia cientifica compativel selecionada. Sem percentis ou faixas universais.</p>'}
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
      const notes = slice.map((t, i) => `${offset + i + 1}: ${trialMetrics(t, d.peso_kg).origem_altura}${t.justificativa ? `; ${t.justificativa}` : ''}${trialWarnings(t).length ? `; ${trialWarnings(t).join(' ')}` : ''}`).join('\n');
      blocks.push(`<div class="jump-trials" style="margin-top:14px;break-inside:avoid"><h3 style="font-size:13px;margin:0 0 6px">${esc(JUMP_PROTOCOLS[p])}${offset ? ' (continuacao)' : ''}</h3>` + table(['Salto', 'cm', 'mm', 'Voo ms', 'Contato ms', 'Pico W', 'W/kg', 'RSI m/s', 'Status'], rows) + `<p style="font-size:9px;white-space:pre-wrap;margin-top:6px">${esc(notes)}</p></div>`);
    }
  }
  return page('Jump Test', summary + blocks.join('') + interpretation);
}
