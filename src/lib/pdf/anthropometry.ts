import { qualificationLabel } from '@/lib/isak-qualification';
import { compareAnthropometry, CORRECTED_GIRTH_RESULT_IDS, MEASUREMENTS, type AnthropometryInput, type AnthropometryResults, type Result } from '@/lib/anthropometry';

// Read persisted snapshots only. No anthropometric calculation belongs in a report.
type Snapshot = AnthropometryResults & { professional?: { name?: string; qualification?: unknown } };
type Row = { registro_v2?: Partial<AnthropometryInput>; resultados_v2?: Snapshot; revision_v2?: number };
const esc = (value: unknown) => value == null ? '' : String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fmt = (value: number | null | undefined) => typeof value === 'number' && Number.isFinite(value) ? value.toLocaleString('pt-BR', { maximumFractionDigits: 2 }) : '-';
export const isAnthropometryV2 = (row: Row | null | undefined): boolean => row?.registro_v2?.version === 2;
const enabled = (row: Row, section: NonNullable<AnthropometryInput['reportSections']>[number]) => !Array.isArray(row.registro_v2?.reportSections) || row.registro_v2!.reportSections!.includes(section);
const cell = (value: unknown) => `<td style="padding:6px 7px;border-bottom:1px solid #e2e8f0;overflow-wrap:anywhere;vertical-align:top">${esc(value)}</td>`;
function table(headers: string[], rows: unknown[][]): string {
  return `<table style="width:100%;table-layout:fixed;border-collapse:collapse;font-size:10px"><thead><tr>${headers.map(h => `<th style="padding:6px 7px;text-align:left;background:#f1f5f9">${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(cell).join('')}</tr>`).join('')}</tbody></table>`;
}
const block = (title: string, content: string) => `<div style="margin-bottom:14px;overflow-wrap:anywhere"><h3 style="font-size:13px;margin:8px 0">${esc(title)}</h3>${content}</div>`;
function textBlocks(title: string, text: string): string {
  return (text.match(/[\s\S]{1,900}/g) ?? ['Nao informado']).map((part, i) => block(i ? `${title} (continuacao)` : title, `<p style="font-size:11px;line-height:1.5;white-space:pre-wrap">${esc(part)}</p>`)).join('');
}
const page = (title: string, content: string) => `<section class="page module anthropometry-v2"><div class="mod-head"><div class="mod-title">${esc(title)}</div></div>${content}</section>`;
function selected(snapshot: Snapshot): Result[] { return (snapshot.results ?? []).filter(r => r.selected); }
function withValue(result: Result): result is Result & { value: number } {
  return typeof result.value === 'number' && Number.isFinite(result.value);
}
function chunks<T>(items: T[], size: number): T[][] {
  const groups: T[][] = [];
  for (let index = 0; index < items.length; index += size) groups.push(items.slice(index, index + size));
  return groups;
}

export function anthropometrySummaryHtml(row: Row): string {
  const snapshot = row.resultados_v2;
  if (!snapshot || snapshot.version !== 2) return '<p>Resultados de antropometria indisponiveis.</p>';
  if (!enabled(row, 'results')) return '';
  return block('Antropometria', '<p style="font-size:11px">Medidas consolidadas e resultados selecionados nas paginas de Antropometria.</p>');
}

export function anthropometryReportHtml(row: Row, analysisHtml = ''): string {
  const s = row.resultados_v2;
  if (!s || s.version !== 2) return page('Antropometria', '<p>Resultados persistidos indisponiveis.</p>');
  const input = row.registro_v2!;
  const qualification = qualificationLabel(s.professional?.qualification, s.calculatedAt);
  const meta = `<p style="font-size:10px;overflow-wrap:anywhere">Data da coleta: ${esc(s.calculatedAt)}${s.professional?.name ? `<br/>Profissional: ${esc(s.professional.name)}${qualification ? ` - ${esc(qualification)}` : ''}` : ''}</p>`;
  const sections: string[] = [];
  if (enabled(row, 'measurements')) {
    const measures = Object.values(s.measurements ?? {}).filter(measurement => typeof measurement.value === 'number' && Number.isFinite(measurement.value));
    const groups = [
      ['Medidas basicas', 'basic'], ['Dobras cutaneas', 'skinfold'],
      ['Perimetros', 'girth'], ['Diametros osseos', 'breadth'],
    ] as const;
    const blocks = groups.map(([title, group]) => {
      const ids = new Set(MEASUREMENTS.filter(item => item.group === group).map(item => item.id));
      const rows = measures.filter(m => ids.has(m.id)).map(m => [`${m.label} (${m.unit}) / ${m.side}`, `${fmt(m.value)} ${m.unit}`]);
      return rows.length ? block(title, table(['Medida / lado', 'Resultado consolidado'], rows)) : '';
    }).filter(Boolean);
    if (blocks.length) sections.push(block('Medidas coletadas', '<p style="font-size:10px">Uma leitura: valor informado; duas leituras: media; tres leituras: mediana.</p>'), ...blocks);
  }
  if (enabled(row, 'results')) {
    const correctedIds = new Set<string>(CORRECTED_GIRTH_RESULT_IDS);
    const correctedGirths = selected(s).filter(result => correctedIds.has(result.id) && withValue(result));
    const rows = selected(s).filter(result =>
      withValue(result)
      &&
      !correctedIds.has(result.id)
      &&
      !(enabled(row, 'measurements') && result.methodId === 'direct')
      && !(enabled(row, 'somatotype') && result.methodId === 'heathCarter'));
    if (correctedGirths.length) sections.push(block('Perimetros corrigidos',
      '<p style="font-size:10px">Derivados por perimetro - pi x dobra cutanea / 10. Medidas brutas preservadas; antebraco sem correcao por nao haver dobra correspondente.</p>' +
      table(['Resultado', 'Valor'], correctedGirths.map(result => [result.label, `${fmt(result.value)} ${result.unit}`]))));
    const resultBlocks = chunks(rows, 14).map((group, index) => block(`Resultados selecionados${index ? ' (continuacao)' : ''}`, table(
      ['Resultado', 'Valor'],
      group.map(r => [r.label, `${fmt(r.value)} ${r.unit}${r.classification ? ` - ${r.classification}` : ''}`]),
    )));
    sections.push(block('Resultados', resultBlocks.length ? '<p style="font-size:10px">Resultados numericos dos metodos selecionados.</p>' : '<p>Nenhum resultado numerico selecionado para publicacao.</p>'), ...resultBlocks);
  }
  const phantom = (s.phantom ?? []).filter(r => r.selected && withValue(r));
  if (enabled(row, 'phantom') && phantom.length) {
    const phantomGroups = chunks(phantom, 22);
    const phantomTable = (group: Result[]) => table(
      ['Medida', 'Z'], group.map(r => [r.label, fmt(r.value)]),
    );
    sections.push(block('Proporcionalidade Phantom', '<p style="font-size:10px">Z-scores de proporcionalidade; nao representam diagnostico, percentil ou ideal.</p>' + phantomTable(phantomGroups[0])),
      ...phantomGroups.slice(1).map(group => block('Proporcionalidade Phantom (continuacao)', phantomTable(group))));
  }
  const soma = s.somatotype;
  if (enabled(row, 'somatotype') && soma && selected(s).some(r => /somato|heath/i.test(r.methodId))) {
    const valid = typeof soma.x === 'number' && Number.isFinite(soma.x) && typeof soma.y === 'number' && Number.isFinite(soma.y);
    const extent = Math.max(10, Math.abs(soma.x ?? 0), Math.abs(soma.y ?? 0));
    sections.push(block('Somatotipo e somatocarta', block('Somatocarta', `<svg role="img" aria-label="Somatocarta" viewBox="0 0 440 300" style="display:block;width:100%;height:300px"><line x1="30" y1="150" x2="410" y2="150" stroke="#64748b"/><line x1="220" y1="20" x2="220" y2="280" stroke="#64748b"/><text x="230" y="18" font-size="11">Mesomorfia (+Y)</text><text x="8" y="170" font-size="11">Endomorfia (-X)</text><text x="315" y="170" font-size="11">Ectomorfia (+X)</text>${valid ? `<circle cx="${220 + soma.x! / extent * 180}" cy="${150 - soma.y! / extent * 120}" r="6" fill="#0891b2"/>` : ''}<text x="30" y="295" font-size="10">Eixos: -${extent} a +${extent}</text></svg>`) + block('Componentes', table(['Endomorfia', 'Mesomorfia', 'Ectomorfia', 'X / Y'], [[fmt(soma.endomorphy), fmt(soma.mesomorphy), fmt(soma.ectomorphy), `${fmt(soma.x)} / ${fmt(soma.y)}`]])) + (soma.classification ? `<p style="font-size:11px">Classificacao: ${esc(soma.classification)}</p>` : '')));
  }
  if (enabled(row, 'context')) {
    const contextRows = [
    ['Contexto do calculo', `Data: ${s.context.date}; sexo: ${s.context.sex}; idade decimal: ${fmt(s.age)} anos`],
    ['Protocolo de coleta', input.collectionProtocol], ['Edicao do manual', input.manualEdition], ['Condicoes', input.conditions], ['Observacoes', input.notes],
    ['Categoria populacional informada', input.populationCategory === 'whiteHispanic' ? 'Branca ou hispanica' : input.populationCategory === 'africanAmerican' ? 'Negra ou afrodescendente' : input.populationCategory === 'asian' ? 'Asiatica' : 'Nao informada'],
    ['Gestacao informada', input.pregnant == null ? 'Nao informada' : input.pregnant ? 'Sim' : 'Nao'],
    ['Atividade', `Fator: ${fmt(input.activityFactor)}; justificativa: ${input.activityJustification || 'Nao informada'}`],
    ].map(([title, value]) => [title, value || 'Nao informado']);
    sections.push(block('Contexto da coleta', table(['Item', 'Registro'], contextRows)),
      ...(input.instruments?.length ? [block('Instrumentos', table(['Instrumento', 'Resolucao', 'Unidade'], input.instruments.map(i => [i.name, fmt(i.resolution), i.unit])))] : []));
  }
  if (enabled(row, 'conclusion')) sections.push(textBlocks('Conclusao profissional', input.professionalConclusion || 'Conclusao profissional nao registrada.'));
  return page('Antropometria', meta + sections.join('') + analysisHtml);
}

export function anthropometryEvolutionHtml(evaluations: { id?: string; data: string; antropometria?: Row }[]): string {
  if (!evaluations.some(e => isAnthropometryV2(e.antropometria))) return '';
  const blocks = evaluations.map((e, index) => {
    const row = e.antropometria;
    if (!isAnthropometryV2(row)) return block(e.data, '<p>Registro anterior nao comparavel automaticamente.</p>');
    const s = row?.resultados_v2;
    if (!s || s.version !== 2) return block(e.data, '<p>Resultados indisponiveis; comparacao nao realizada.</p>');
    const previousRow = evaluations[index - 1]?.antropometria;
    const previous = isAnthropometryV2(previousRow) ? previousRow?.resultados_v2 : undefined;
    const comparisons = previous ? compareAnthropometry(s as AnthropometryResults, previous as AnthropometryResults) : [];
    const heading = e.data;
    const rows = selected(s).filter(withValue);
    const comparisonRows = rows.map(r => {
      const before = previous?.results?.find(p => p.selected && p.id === r.id && p.methodId === r.methodId);
      const comparison = comparisons.find(c => c.id === r.id);
      const compatible = comparison?.compatible && previous?.engineVersion === s.engineVersion && previous?.catalogVersion === s.catalogVersion &&
        before?.methodVersion === r.methodVersion && before?.unit === r.unit && before?.status === 'available' && r.status === 'available' &&
        typeof before?.value === 'number' && Number.isFinite(before.value) && typeof r.value === 'number' && Number.isFinite(r.value);
      const change = compatible ? `${fmt(comparison.delta)} ${r.unit}` : 'Nao comparavel automaticamente';
      return [r.label, `${fmt(r.value)} ${r.unit}`, change];
    });
    return rows.length ? chunks(comparisonRows, 10).map((group, index) => block(index ? `${heading} (continuacao)` : heading,
      table(['Resultado selecionado', 'Valor', 'Variacao'], group))).join('') : block(heading, '<p>Nenhum resultado numerico selecionado para publicacao.</p>');
  });
  return page('Antropometria - evolucao', '<p style="font-size:11px">Valores consolidados salvos em cada avaliacao. Resultados nao comparaveis nao recebem variacao automatica.</p>' + blocks.join(''));
}
