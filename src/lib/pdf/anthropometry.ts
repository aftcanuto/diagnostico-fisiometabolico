import { qualificationLabel } from '@/lib/isak-qualification';
import { compareAnthropometry, CORRECTED_GIRTH_RESULT_IDS, MEASUREMENTS, type AnthropometryInput, type AnthropometryResults, type Result } from '@/lib/anthropometry';

// Read persisted snapshots only. No anthropometric calculation belongs in a report.
type Snapshot = AnthropometryResults & { professional?: { name?: string; qualification?: unknown } };
type Row = { registro_v2?: Partial<AnthropometryInput>; resultados_v2?: Snapshot; revision_v2?: number };
const esc = (value: unknown) => value == null ? '' : String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fmt = (value: number | null | undefined) => typeof value === 'number' && Number.isFinite(value) ? value.toLocaleString('pt-BR', { maximumFractionDigits: 2 }) : '-';
const status = (value: string) => ({ available: 'Disponivel', missing: 'Ausente', review: 'Revisar', invalid: 'Invalido' }[value] ?? value);
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
function chunks<T>(items: T[], size: number): T[][] {
  const groups: T[][] = [];
  for (let index = 0; index < items.length; index += size) groups.push(items.slice(index, index + size));
  return groups;
}

export function anthropometrySummaryHtml(row: Row): string {
  const snapshot = row.resultados_v2;
  if (!snapshot || snapshot.version !== 2) return '<p>Antropometria V2: snapshot de resultados indisponivel.</p>';
  if (!enabled(row, 'results')) return '';
  return block('Antropometria V2', `<p style="font-size:11px">Resultados selecionados e respectivas ressalvas nas paginas de Antropometria. Motor ${esc(snapshot.engineVersion)}; revisao ${esc(row.revision_v2 ?? '-')}.</p>`);
}

export function anthropometryReportHtml(row: Row): string {
  const s = row.resultados_v2;
  if (!s || s.version !== 2) return page('Antropometria V2', '<p>Snapshot persistido indisponivel. Resultados nao foram recalculados.</p>');
  const input = row.registro_v2!;
  const qualification = qualificationLabel(s.professional?.qualification, s.calculatedAt);
  const meta = `<p style="font-size:10px;overflow-wrap:anywhere">Motor ${esc(s.engineVersion)} | Catalogo ${esc(s.catalogVersion)} | Revisao ${esc(row.revision_v2 ?? '-')} | ${esc(s.calculatedAt)}<br/>${esc(s.professional?.name ?? '')}${qualification ? ` - ${esc(qualification)}` : ''}</p>`;
  const sections: string[] = [];
  if (enabled(row, 'measurements')) {
    const measures = Object.values(s.measurements ?? {});
    const groups = [
      ['Medidas basicas', 'basic'], ['Dobras cutaneas', 'skinfold'],
      ['Perimetros', 'girth'], ['Diametros osseos', 'breadth'],
    ] as const;
    const blocks = groups.map(([title, group]) => {
      const ids = new Set(MEASUREMENTS.filter(item => item.group === group).map(item => item.id));
      return block(title, table(['Medida / lado', '1 / 2 / 3', 'Consolidada', 'Qualidade'], measures.filter(m => ids.has(m.id)).map(m => [
        `${m.label} (${m.unit}) / ${m.side}`, m.readings.map(fmt).join(' / '), `${fmt(m.value)} ${m.unit} (${m.consolidation})`,
        `${status(m.status)}; discrepancia ${fmt(m.discrepancyPercent)}%${m.requiresThird ? '; terceira medida necessaria' : ''}${m.reason ? `; ${m.reason}` : ''}${m.exception ? '; excecao registrada abaixo' : ''}`,
      ])));
    });
    sections.push(block('Medidas e qualidade da coleta', '<p style="font-size:10px">Leituras brutas, consolidacao e controle de discrepancia.</p>'), ...blocks,
      ...measures.filter(m => m.exception).map(m => textBlocks(`${m.label} - excecao`, m.exception)));
  }
  if (enabled(row, 'results')) {
    const correctedIds = new Set<string>(CORRECTED_GIRTH_RESULT_IDS);
    const correctedGirths = selected(s).filter(result => correctedIds.has(result.id));
    const rows = selected(s).filter(result =>
      !correctedIds.has(result.id)
      &&
      !(enabled(row, 'measurements') && result.methodId === 'direct')
      && !(enabled(row, 'somatotype') && result.methodId === 'heathCarter'));
    if (correctedGirths.length) sections.push(block('Perimetros corrigidos',
      '<p style="font-size:10px">Derivados por perimetro - pi x dobra cutanea / 10. Medidas brutas preservadas; antebraco sem correcao por nao haver dobra correspondente.</p>' +
      table(['Resultado', 'Valor', 'Situacao'], correctedGirths.map(result => [result.label, `${fmt(result.value)} ${result.unit}`, `${status(result.status)}${result.reason ? `; ${result.reason}` : ''}`]))));
    const resultBlocks = chunks(rows, 9).map((group, index) => block(`Resultados selecionados${index ? ' (continuacao)' : ''}`, table(
      ['Resultado', 'Valor', 'Metodo / versao', 'Situacao'],
      group.map(r => [r.label, `${fmt(r.value)} ${r.unit}`, `${s.methodMeta.find(m => m.id === r.methodId)?.label ?? r.methodId} / ${r.methodVersion}`,
        `${status(r.status)}${r.classification ? `; ${r.classification}` : ''}`]),
    )));
    sections.push(block('Resultados', resultBlocks.length ? '<p style="font-size:10px">Somente metodos selecionados; medidas e somatotipo nao sao duplicados.</p>' : '<p>Nenhum metodo selecionado para publicacao.</p>'), ...resultBlocks);
    const cautions = rows.filter(result => result.reason && result.status !== 'available');
    if (cautions.length) sections.push(...chunks(cautions, 8).map((group, index) => block(`Ressalvas dos resultados${index ? ' (continuacao)' : ''}`,
      table(['Resultado', 'Situacao e ressalva'], group.map(result => [result.label, `${status(result.status)}: ${result.reason}`])))));
    const selectedMethods = [...new Set(rows.map(result => result.methodId))]
      .map(id => s.methodMeta.find(method => method.id === id)).filter(Boolean);
    if (selectedMethods.length) sections.push(...chunks(selectedMethods, 5).map((group, index) => block(`Metodos e rastreabilidade${index ? ' (continuacao)' : ''}`,
      table(['Metodo / versao', 'Populacao e limitacoes', 'Referencias'], group.map(method => [
        `${method!.label} / ${method!.version}`, `${method!.population}; ${method!.limitations}`,
        method!.referenceIds.join(', ') || '-',
      ])))));
  }
  const phantom = (s.phantom ?? []).filter(r => r.selected);
  if (enabled(row, 'phantom') && phantom.length) {
    const phantomGroups = chunks(phantom, 22);
    const phantomTable = (group: Result[]) => table(
      ['Medida', 'Z', 'Situacao'], group.map(r => [r.label, fmt(r.value), status(r.status)]),
    );
    sections.push(block('Proporcionalidade Phantom', '<p style="font-size:10px">Z-scores de proporcionalidade; nao representam diagnostico, percentil ou ideal. Metodo, versao, limitacoes e referencias constam na rastreabilidade acima.</p>' + phantomTable(phantomGroups[0])),
      ...phantomGroups.slice(1).map(group => block('Proporcionalidade Phantom (continuacao)', phantomTable(group))));
  }
  const soma = s.somatotype;
  if (enabled(row, 'somatotype') && soma && selected(s).some(r => /somato|heath/i.test(r.methodId))) {
    const valid = typeof soma.x === 'number' && Number.isFinite(soma.x) && typeof soma.y === 'number' && Number.isFinite(soma.y);
    const extent = Math.max(10, Math.abs(soma.x ?? 0), Math.abs(soma.y ?? 0));
    sections.push(block('Somatotipo e somatocarta', block('Somatocarta', `<svg role="img" aria-label="Somatocarta" viewBox="0 0 440 300" style="display:block;width:100%;height:300px"><line x1="30" y1="150" x2="410" y2="150" stroke="#64748b"/><line x1="220" y1="20" x2="220" y2="280" stroke="#64748b"/><text x="230" y="18" font-size="11">Mesomorfia (+Y)</text><text x="8" y="170" font-size="11">Endomorfia (-X)</text><text x="315" y="170" font-size="11">Ectomorfia (+X)</text>${valid ? `<circle cx="${220 + soma.x! / extent * 180}" cy="${150 - soma.y! / extent * 120}" r="6" fill="#0891b2"/>` : ''}<text x="30" y="295" font-size="10">Eixos: -${extent} a +${extent}</text></svg>`) + block('Componentes persistidos', table(['Endomorfia', 'Mesomorfia', 'Ectomorfia', 'X / Y'], [[fmt(soma.endomorphy), fmt(soma.mesomorphy), fmt(soma.ectomorphy), `${fmt(soma.x)} / ${fmt(soma.y)}`]])) + `<p>${esc(status(soma.status))}: ${esc(soma.reason)} ${esc(soma.classification)}</p>`));
  }
  if (enabled(row, 'context')) {
    const contextRows = [
    ['Contexto do calculo', `Data: ${s.context.date}; sexo: ${s.context.sex}; idade decimal: ${fmt(s.age)} anos`],
    ['Protocolo de coleta', input.collectionProtocol], ['Edicao do manual', input.manualEdition], ['Condicoes', input.conditions], ['Observacoes', input.notes],
    ['Categoria populacional informada', input.populationCategory === 'whiteHispanic' ? 'Branca ou hispanica' : input.populationCategory === 'africanAmerican' ? 'Negra ou afrodescendente' : input.populationCategory === 'asian' ? 'Asiatica' : 'Nao informada'],
    ['Gestacao informada', input.pregnant == null ? 'Nao informada' : input.pregnant ? 'Sim' : 'Nao'],
    ['Atividade', `Fator: ${fmt(input.activityFactor)}; justificativa: ${input.activityJustification || 'Nao informada'}`],
    ].map(([title, value]) => [title, value || 'Nao informado']);
    sections.push(block('Contexto e rastreabilidade', table(['Item', 'Registro'], contextRows)),
      ...(input.instruments?.length ? [block('Instrumentos', table(['Instrumento', 'Resolucao', 'Unidade'], input.instruments.map(i => [i.name, fmt(i.resolution), i.unit])))] : []));
  }
  if (enabled(row, 'conclusion')) sections.push(textBlocks('Conclusao profissional', input.professionalConclusion || 'Conclusao profissional nao registrada.'));
  return page('Antropometria', meta + sections.join(''));
}

export function anthropometryEvolutionHtml(evaluations: { id?: string; data: string; antropometria?: Row }[]): string {
  if (!evaluations.some(e => isAnthropometryV2(e.antropometria))) return '';
  const blocks = evaluations.map((e, index) => {
    const row = e.antropometria;
    if (!isAnthropometryV2(row)) return block(e.data, '<p>Registro legado: descontinuidade de versao; sem delta com V2.</p>');
    const s = row?.resultados_v2;
    if (!s || s.version !== 2) return block(e.data, '<p>Snapshot V2 indisponivel; comparacao nao realizada.</p>');
    const previousRow = evaluations[index - 1]?.antropometria;
    const previous = isAnthropometryV2(previousRow) ? previousRow?.resultados_v2 : undefined;
    const comparisons = previous ? compareAnthropometry(s as AnthropometryResults, previous as AnthropometryResults) : [];
    const heading = `${e.data} | motor ${s.engineVersion} | catalogo ${s.catalogVersion} | revisao ${row?.revision_v2 ?? '-'}`;
    const rows = selected(s);
    const comparisonRows = rows.map(r => {
      const before = previous?.results?.find(p => p.selected && p.id === r.id && p.methodId === r.methodId);
      const comparison = comparisons.find(c => c.id === r.id);
      const compatible = comparison?.compatible && previous?.engineVersion === s.engineVersion && previous?.catalogVersion === s.catalogVersion &&
        before?.methodVersion === r.methodVersion && before?.unit === r.unit && before?.status === 'available' && r.status === 'available' &&
        typeof before?.value === 'number' && Number.isFinite(before.value) && typeof r.value === 'number' && Number.isFinite(r.value);
      const change = compatible ? `${fmt(comparison.delta)} ${r.unit}` : `Sem delta: ${comparison?.reason || 'versao, metodo, selecao ou qualidade nao comparavel'}`;
      return [r.label, `${fmt(r.value)} ${r.unit}`, `${r.methodId} / ${r.methodVersion}`, `${change}; ${status(r.status)}${r.reason ? `; ${r.reason}` : ''}`];
    });
    return rows.length ? chunks(comparisonRows, 7).map((group, index) => block(index ? `${heading} (continuacao)` : heading,
      table(['Resultado selecionado', 'Valor original', 'Metodo / versao', 'Variacao / qualidade'], group))).join('') : block(heading, '<p>Nenhum metodo selecionado para publicacao.</p>');
  });
  return page('Antropometria V2 - evolucao', '<p style="font-size:11px">Valores dos snapshots selecionados, sem recalculo. Metodos, unidades ou versoes distintos representam descontinuidade e nao recebem delta.</p>' + blocks.join(''));
}
