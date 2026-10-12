import { qualificationLabel } from '@/lib/isak-qualification';
import { compareAnthropometry, CORRECTED_GIRTH_RESULT_IDS, MEASUREMENTS, REGIONAL_DISTRIBUTION_RESULT_IDS, type AnthropometryInput, type AnthropometryResults, type Result } from '@/lib/anthropometry';
import { FEMALE_BODY_MODEL_DATA_URI, MALE_BODY_MODEL_DATA_URI, SOMATOTYPE_REFERENCE_DATA_URI } from '@/lib/anthropometry/body-assets.generated';
import { classifySomatotype } from '@/lib/anthropometry/formulas';

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
const page = (title: string, content: string) => `<section class="page module anthropometry-v2"><div class="mod-head"><div class="mod-title">${esc(title)}</div></div>${title === 'Antropometria' ? '<p class="module-intro">A antropometria descreve dimensoes, proporcoes e composicao corporal estimada a partir de medidas padronizadas. O resumo facilita a leitura; as paginas seguintes apresentam os metodos e resultados detalhados.</p>' : ''}${content}</section>`;
function selected(snapshot: Snapshot): Result[] { return (snapshot.results ?? []).filter(r => r.selected); }
function withValue(result: Result): result is Result & { value: number } {
  return typeof result.value === 'number' && Number.isFinite(result.value);
}
function chunks<T>(items: T[], size: number): T[][] {
  const groups: T[][] = [];
  for (let index = 0; index < items.length; index += size) groups.push(items.slice(index, index + size));
  return groups;
}

function bodyModelDataUri(sex: string): string {
  return sex === 'F' ? FEMALE_BODY_MODEL_DATA_URI : MALE_BODY_MODEL_DATA_URI;
}

function dashboardBodyHtml(sex: string): string {
  const female = sex === 'F';
  const model = bodyModelDataUri(sex);
  return `<svg role="img" aria-label="Modelo corporal ${female ? 'feminino' : 'masculino'}" data-body-sex="${female ? 'F' : 'M'}" viewBox="238 30 164 315" style="display:block;width:128px;height:242px;margin:0 auto">
    <path d="M320 39 H282 Q248 39 248 75 V304 Q248 338 282 338 H320 Z" fill="#f8e9eb"/><path d="M320 39 H358 Q392 39 392 75 V304 Q392 338 358 338 H320 Z" fill="#e5f4f0"/>
    <image href="${model}" x="251" y="45" width="138" height="285" preserveAspectRatio="xMidYMid meet"/><line x1="320" y1="40" x2="320" y2="337" stroke="#fff" stroke-width="2" opacity=".92"/>
  </svg>`;
}

function anthropometryDashboardHtml(snapshot: Snapshot): string {
  const rows = selected(snapshot);
  const result = (id: string) => rows.find(item => item.id === id && withValue(item));
  const firstResult = (ids: string[]) => ids.map(result).find(Boolean);
  const measurement = (id: keyof Snapshot['measurements']) => snapshot.measurements?.[id]?.value ?? null;
  const fat = result('fatPercent');
  const bmi = result('bmiClassification') ?? result('bmi');
  const waistHeight = result('waistHeightRatio');
  const waistHip = result('waistHipRatio');
  const conicity = result('conicityIndex');
  const cormic = result('cormicIndex');
  const mass = measurement('mass');
  const height = measurement('height');
  const waist = measurement('waist');
  const conicityValue = conicity?.value ?? (waist != null && mass != null && height != null && mass > 0 && height > 0
    ? (waist / 100) / (0.109 * Math.sqrt(mass / (height / 100)))
    : null);
  const soma = snapshot.somatotype;
  const somatoClassification = [soma.endomorphy, soma.mesomorphy, soma.ectomorphy].every(value => typeof value === 'number' && Number.isFinite(value))
    ? classifySomatotype(soma.endomorphy!, soma.mesomorphy!, soma.ectomorphy!)
    : soma.classification;
  const fatValue = fat?.value ?? null;
  const muscleMass = firstResult(['lee2000', 'martin1990', 'kerrMuscle1988']);
  const adiposeMass = firstResult(['kerrAdipose1988', 'fatMass']);
  const boneMass = firstResult(['martinBone1991', 'rocha1975']);
  const musclePercent = firstResult(['lee2000Percent', 'martin1990Percent', 'kerrMuscle1988Percent']);
  const adiposePercent = firstResult(['kerrAdipose1988Percent', 'fatPercent']);
  const bonePercent = firstResult(['martinBone1991Percent', 'rocha1975Percent']);
  const tissueBase = [adiposePercent?.value, musclePercent?.value, bonePercent?.value];
  const tissueAvailable = tissueBase.every(value => typeof value === 'number' && Number.isFinite(value) && value >= 0);
  const tissueSubtotal = tissueAvailable ? tissueBase.reduce<number>((sum, value) => sum + Number(value), 0) : 0;
  const tissueValues = tissueAvailable && tissueSubtotal <= 100
    ? [...tissueBase.map(Number), 100 - tissueSubtotal]
    : tissueAvailable && tissueSubtotal > 0
      ? [...tissueBase.map(value => Number(value) / tissueSubtotal * 100), 0]
      : [];
  const tissueLabels = ['Adiposa', 'Muscular', 'Ossea', 'Residual'];
  const tissueColors = ['#b75b6b', '#168b76', '#6686a8', '#d6b66d'];
  const card = (label: string, amount: number | null, unit: string, note: string) => `<div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:13px 14px;min-height:82px">
    <div style="font-size:8px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.7px">${esc(label)}</div>
    <div style="font-size:24px;font-weight:800;color:#0f172a;line-height:1.1;margin-top:6px">${fmt(amount)} <span style="font-size:10px;font-weight:500;color:#94a3b8">${esc(unit)}</span></div>
    <div style="font-size:9px;line-height:1.35;color:#64748b;margin-top:5px">${esc(note)}</div>
  </div>`;
  const tissueBar = tissueAvailable ? `<div data-tissue-total="100" style="height:18px;border-radius:999px;overflow:hidden;display:flex;background:#e2e8f0">${tissueValues.map((value, index) => `<span title="${tissueLabels[index]} ${fmt(value)}%" style="width:${Math.max(0, value)}%;background:${tissueColors[index]}"></span>`).join('')}</div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:9px">${tissueLabels.map((label, index) => `<div style="font-size:8px;color:#64748b"><span style="display:inline-block;width:7px;height:7px;border-radius:2px;background:${tissueColors[index]};margin-right:4px"></span>${label}<strong style="display:block;font-size:12px;color:#334155;margin-top:3px">${fmt(tissueValues[index])}%</strong></div>`).join('')}</div>` : '<p style="font-size:9px;color:#64748b;margin:8px 0 0">Fracionamento indisponivel: selecione estimativas de massa adiposa, muscular e ossea.</p>';
  const bmiNote = bmi?.classification || 'Indice de massa corporal';
  const waistNote = waistHeight ? `Cintura/estatura: ${fmt(waistHeight.value)}` : 'Relacao cintura/estatura indisponivel';
  const dashboard = `<div data-anthropometry-dashboard="true">
    <div style="display:flex;justify-content:space-between;gap:18px;align-items:flex-start;margin-bottom:16px">
      <div><div style="font-size:11px;font-weight:800;color:#087f6d;text-transform:uppercase;letter-spacing:1px">Resumo corporal</div><p style="font-size:11px;line-height:1.45;color:#64748b;margin:6px 0 0">Uma leitura visual dos principais resultados. Os detalhes tecnicos, metodos e medidas aparecem nas paginas seguintes.</p></div>
      <div style="font-size:9px;color:#64748b;text-align:right;white-space:nowrap">Coleta: ${esc(snapshot.calculatedAt)}</div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin-bottom:15px">
      ${card('Gordura corporal', fatValue, '%', 'Estimativa por dobras cutaneas')}
      ${card('Massa muscular', muscleMass?.value ?? null, 'kg', muscleMass?.label ?? 'Estimativa selecionada')}
      ${card('Massa ossea', boneMass?.value ?? null, 'kg', boneMass?.label ?? 'Estimativa selecionada')}
      ${card('IMC', bmi?.value ?? null, 'kg/m2', bmiNote)}
      ${card('Massa corporal', mass, 'kg', height == null ? 'Medida coletada' : `Estatura: ${fmt(height)} cm`)}
      ${card('Massa adiposa', adiposeMass?.value ?? null, 'kg', adiposeMass?.label ?? 'Estimativa selecionada')}
    </div>
    <div style="display:grid;grid-template-columns:190px 1fr;gap:15px;align-items:stretch">
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px 12px;text-align:center">
        ${dashboardBodyHtml(snapshot.context.sex)}
        <div style="font-size:8px;color:#94a3b8;text-transform:uppercase;letter-spacing:.6px">Perfil corporal</div>
        <div style="font-size:14px;font-weight:800;color:#0f172a;margin-top:4px">${esc(somatoClassification || 'Nao calculado')}</div>
        <div style="font-size:8px;color:#64748b;line-height:1.35;margin-top:4px">Descricao morfologica; nao representa diagnostico.</div>
      </div>
      <div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:16px 18px">
        <div style="font-size:13px;font-weight:800;color:#0f172a">Composicao corporal estimada</div>
        <p style="font-size:9px;line-height:1.45;color:#64748b;margin:5px 0 12px">Participacao da massa corporal em quatro compartimentos. ${esc(waistNote)}.</p>
        ${tissueBar}
        <div style="margin-top:14px;padding-top:11px;border-top:1px solid #e2e8f0;display:grid;grid-template-columns:repeat(3,1fr);gap:8px;text-align:center">
          <div><span style="font-size:8px;color:#94a3b8">ENDOMORFIA</span><strong style="display:block;font-size:14px;color:#334155;margin-top:3px">${fmt(soma.endomorphy)}</strong></div>
          <div><span style="font-size:8px;color:#94a3b8">MESOMORFIA</span><strong style="display:block;font-size:14px;color:#334155;margin-top:3px">${fmt(soma.mesomorphy)}</strong></div>
          <div><span style="font-size:8px;color:#94a3b8">ECTOMORFIA</span><strong style="display:block;font-size:14px;color:#334155;margin-top:3px">${fmt(soma.ectomorphy)}</strong></div>
        </div>
      </div>
    </div>
    <div style="margin-top:11px;border:1px solid #dbe7e3;background:#f4fbf8;border-radius:8px;padding:10px 12px">
      <div style="font-size:8px;font-weight:800;color:#087f6d;text-transform:uppercase;letter-spacing:.7px;margin-bottom:7px">Indicadores de saude e proporcionalidade</div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">
        <div><span style="font-size:8px;color:#64748b">Cintura / estatura</span><strong style="display:block;font-size:13px;color:#0f172a;margin-top:2px">${fmt(waistHeight?.value)}</strong></div>
        <div><span style="font-size:8px;color:#64748b">Cintura / quadril</span><strong style="display:block;font-size:13px;color:#0f172a;margin-top:2px">${fmt(waistHip?.value)}</strong></div>
        <div><span style="font-size:8px;color:#64748b">Conicidade</span><strong style="display:block;font-size:13px;color:#0f172a;margin-top:2px">${fmt(conicityValue)}</strong></div>
        <div><span style="font-size:8px;color:#64748b">Indice cormico</span><strong style="display:block;font-size:13px;color:#0f172a;margin-top:2px">${fmt(cormic?.value)}${cormic ? '%' : ''}</strong></div>
      </div>
    </div>
    <p style="font-size:8.5px;line-height:1.45;color:#64748b;margin:11px 2px 0">As massas sao estimativas antropometricas e nao equivalem a mensuracao por DXA.</p>
  </div>`;
  return page('Antropometria', dashboard);
}

function regionalBodyHtml(rows: Result[], sex: string): string {
  const value = (id: string) => rows.find(result => result.id === id && withValue(result))?.value ?? null;
  const female = sex === 'F';
  const model = bodyModelDataUri(sex);
  const label = (x: number, y: number, title: string, amount: number | null, color: string, anchor = 'start') => `<g transform="translate(${x} ${y})"><text text-anchor="${anchor}" font-size="11" fill="#64748b">${esc(title)}</text><text y="22" text-anchor="${anchor}" font-size="20" font-weight="700" fill="${color}">${fmt(amount)}%</text></g>`;
  return `<div style="break-inside:avoid;page-break-inside:avoid;border:1px solid #e2e8f0;border-radius:8px;padding:10px;background:#f8fafc">
    <svg role="img" aria-label="Distribuicao antropometrica regional" data-body-sex="${female ? 'F' : 'M'}" viewBox="0 0 640 340" style="display:block;width:100%;height:285px">
      <text x="24" y="24" font-size="12" font-weight="700" fill="#9f3f4f">ADIPOSIDADE RELATIVA</text><text x="616" y="24" text-anchor="end" font-size="12" font-weight="700" fill="#087f6d">MUSCULARIDADE RELATIVA</text>
      <path d="M320 39 H282 Q248 39 248 75 V304 Q248 338 282 338 H320 Z" fill="#f8e9eb"/><path d="M320 39 H358 Q392 39 392 75 V304 Q392 338 358 338 H320 Z" fill="#e5f4f0"/>
      ${model ? `<image href="${model}" x="251" y="45" width="138" height="285" preserveAspectRatio="xMidYMid meet"/>` : ''}<line x1="320" y1="40" x2="320" y2="337" stroke="#fff" stroke-width="2" opacity=".92"/>
      <g fill="none" stroke="#a94f5c" stroke-width="1.5"><path d="M278 105 H158"/><path d="M286 178 H158"/><path d="M292 270 H158"/></g>
      <g fill="none" stroke="#087f6d" stroke-width="1.5"><path d="M366 115 H482"/><path d="M350 228 H482"/><path d="M356 294 H482"/></g>
      ${label(24,88,'Superior',value('regionalAdiposityUpper'),'#9f3f4f')}${label(24,171,'Central',value('regionalAdiposityCentral'),'#9f3f4f')}${label(24,254,'Inferior',value('regionalAdiposityLower'),'#9f3f4f')}
      ${label(616,98,'Braco',value('regionalMuscularityArm'),'#087f6d','end')}${label(616,211,'Coxa',value('regionalMuscularityThigh'),'#087f6d','end')}${label(616,277,'Panturrilha',value('regionalMuscularityCalf'),'#087f6d','end')}
      <g fill="none" stroke="#147d6f" stroke-width="2" opacity=".8"><path d="M337 98 Q352 115 341 139"/><path d="M334 169 Q352 185 340 205"/><path d="M339 232 Q350 252 340 277"/><path d="M336 282 Q347 298 339 313"/></g>
    </svg>
    <p style="font-size:9px;line-height:1.45;color:#64748b;margin:5px 4px 0">Distribuicao descritiva. Adiposidade: participacao dos pares de dobras na soma de seis dobras. Muscularidade: participacao de braco, coxa e panturrilha corrigidos na soma desses tres perimetros. Nao corresponde a massa tecidual regional medida.</p>
  </div>`;
}

function somatochartHtml(soma: Snapshot['somatotype'], _sex?: string): string {
  const valid = typeof soma.x === 'number' && Number.isFinite(soma.x) && typeof soma.y === 'number' && Number.isFinite(soma.y);
  const projectX = (amount: number) => 320 + Math.max(-10, Math.min(10, amount)) / 10 * 168;
  const projectY = (amount: number) => 290 - (Math.max(-12, Math.min(18, amount)) + 12) / 30 * 214;
  return `<div style="break-inside:avoid;page-break-inside:avoid"><svg role="img" aria-label="Somatocarta Heath-Carter" viewBox="0 0 640 350" style="display:block;width:100%;height:270px">
    <rect width="640" height="370" rx="8" fill="#f8fafc"/><path d="M116 300 Q320 354 524 300 Q564 164 320 54 Q76 164 116 300 Z" fill="#fff" stroke="#cbd5e1" stroke-width="2"/>
    <path d="M116 300 Q203 177 320 54 Q260 222 320 300 Z" fill="#f9e8eb" opacity=".82"/><path d="M320 54 Q437 177 524 300 L320 300 Z" fill="#e5f4f0" opacity=".9"/><path d="M116 300 Q320 224 524 300 Q320 351 116 300 Z" fill="#edf2f7" opacity=".9"/>
    <g fill="none" stroke="#d4dde5" stroke-width="1"><path d="M155 278 Q320 322 485 278"/><path d="M198 244 Q320 275 442 244"/><path d="M155 275 Q222 160 320 54"/><path d="M485 275 Q418 160 320 54"/></g>
    <line x1="126" y1="218" x2="514" y2="218" stroke="#94a3b8"/><line x1="320" y1="66" x2="320" y2="300" stroke="#94a3b8"/>
    <text x="320" y="32" text-anchor="middle" font-size="13" font-weight="700" fill="#334155">MESOMORFIA</text><text x="96" y="326" font-size="13" font-weight="700" fill="#9f3f4f">ENDOMORFIA</text><text x="544" y="326" text-anchor="end" font-size="13" font-weight="700" fill="#087f6d">ECTOMORFIA</text>
    ${valid ? `<circle cx="${projectX(soma.x!)}" cy="${projectY(soma.y!)}" r="13" fill="#0f766e" opacity=".18"/><circle cx="${projectX(soma.x!)}" cy="${projectY(soma.y!)}" r="6" fill="#0f766e" stroke="#fff" stroke-width="2"/>` : ''}
    <text x="320" y="340" text-anchor="middle" font-size="10" fill="#64748b">O ponto combina endomorfia, mesomorfia e ectomorfia no sistema Heath-Carter.</text>
  </svg><div style="font-size:9px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.8px;margin:4px 0 6px">Legenda visual dos perfis corporais</div><img data-somatotype-reference="true" src="${SOMATOTYPE_REFERENCE_DATA_URI}" alt="Perfis ectomorfo, mesomorfo e endomorfo" style="display:block;width:100%;height:235px;object-fit:contain;border:1px solid #e2e8f0;border-radius:8px;background:#fff"/></div>`;
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
    const regionalIds = new Set<string>(REGIONAL_DISTRIBUTION_RESULT_IDS);
    const correctedGirths = selected(s).filter(result => correctedIds.has(result.id) && withValue(result));
    const regionalRows = selected(s).filter(result => regionalIds.has(result.id) && withValue(result));
    const rows = selected(s).filter(result =>
      withValue(result)
      &&
      !correctedIds.has(result.id)
      && !regionalIds.has(result.id)
      &&
      !(enabled(row, 'measurements') && result.methodId === 'direct')
      && !(enabled(row, 'somatotype') && result.methodId === 'heathCarter'));
    const forearm = s.measurements?.forearm?.value;
    const correctedRows: unknown[][] = correctedGirths.map(result => [result.label, `${fmt(result.value)} ${result.unit}`]);
    if (typeof forearm === 'number' && Number.isFinite(forearm)) correctedRows.splice(1, 0, ['Antebraco (medida direta, sem correcao)', `${fmt(forearm)} cm`]);
    if (correctedRows.length) sections.push(block('Perimetros corrigidos',
      '<p style="font-size:10px">Os perimetros corrigidos reduzem a contribuicao da gordura subcutanea para representar melhor o volume muscular dos segmentos. O antebraco e apresentado como medida direta, pois o protocolo nao utiliza uma dobra correspondente para correcao.</p>' +
      table(['Resultado', 'Valor'], correctedRows)));
    if (regionalRows.length) sections.push(block('Distribuicao antropometrica regional', regionalBodyHtml(regionalRows, s.context.sex)));
    const resultBlocks = chunks(rows, 14).map((group, index) => block(`Resultados selecionados${index ? ' (continuacao)' : ''}`, table(
      ['Resultado', 'Valor'],
      group.map(r => [r.label, `${fmt(r.value)} ${r.unit}${r.classification ? ` - ${r.classification}` : ''}`]),
    )));
    if (resultBlocks.length) sections.push(block('Resultados', '<p style="font-size:10px">Resultados numericos dos metodos selecionados.</p>' + resultBlocks[0]), ...resultBlocks.slice(1));
    else sections.push(block('Resultados', '<p>Nenhum resultado numerico selecionado para publicacao.</p>'));
  }
  const phantom = (s.phantom ?? []).filter(r => r.selected && withValue(r));
  if (enabled(row, 'phantom') && phantom.length) {
    const phantomGroups = chunks(phantom, 22);
    const phantomTable = (group: Result[]) => table(
      ['Medida', 'Z'], group.map(r => [r.label, fmt(r.value)]),
    );
    const phantomExplanation = `<div style="margin:0 0 12px;padding:11px 13px;border-left:3px solid #0f766e;background:#f0fdfa;border-radius:4px;font-size:10px;line-height:1.45;color:#334155">
      <strong style="display:block;margin-bottom:4px;color:#0f4f49">O que e o modelo Phantom?</strong>
      O Phantom e uma referencia humana conceitual e unissex, com proporcoes padronizadas. Ele ajusta as medidas corporais para uma estatura geometrica de referencia, permitindo comparar a proporcionalidade de pessoas com tamanhos diferentes. O escore Z mostra quanto cada medida se afasta da referencia: valores positivos indicam proporcao relativamente maior e valores negativos, relativamente menor. Esses resultados descrevem proporcionalidade corporal; nao representam percentil, diagnostico ou corpo ideal.
    </div>`;
    sections.push(block('Proporcionalidade Phantom', phantomExplanation + phantomTable(phantomGroups[0])),
      ...phantomGroups.slice(1).map(group => block('Proporcionalidade Phantom (continuacao)', phantomTable(group))));
  }
  const soma = s.somatotype;
  if (enabled(row, 'somatotype') && soma && selected(s).some(r => /somato|heath/i.test(r.methodId))) {
    const classification = [soma.endomorphy, soma.mesomorphy, soma.ectomorphy].every(value => typeof value === 'number' && Number.isFinite(value))
      ? classifySomatotype(soma.endomorphy!, soma.mesomorphy!, soma.ectomorphy!)
      : soma.classification;
    sections.push(block('Somatotipo e somatocarta', block('Somatocarta', somatochartHtml(soma, s.context.sex)) + block('Componentes', table(['Endomorfia', 'Mesomorfia', 'Ectomorfia', 'X / Y'], [[fmt(soma.endomorphy), fmt(soma.mesomorphy), fmt(soma.ectomorphy), `${fmt(soma.x)} / ${fmt(soma.y)}`]])) + (classification ? `<p style="font-size:11px">Classificacao: ${esc(classification)}</p>` : '')));
  }
  if (enabled(row, 'context')) {
    const contextRows = [
    ['Contexto do calculo', `Data: ${s.context.date}; sexo: ${s.context.sex}; idade decimal: ${fmt(s.age)} anos`],
    ['Protocolo de coleta', input.collectionProtocol], ['Condicoes', input.conditions], ['Observacoes', input.notes],
    ['Categoria populacional informada', input.populationCategory === 'whiteHispanic' ? 'Branca ou hispanica' : input.populationCategory === 'africanAmerican' ? 'Negra ou afrodescendente' : input.populationCategory === 'asian' ? 'Asiatica' : 'Nao informada'],
    ['Gestacao informada', input.pregnant == null ? 'Nao informada' : input.pregnant ? 'Sim' : 'Nao'],
    ].map(([title, value]) => [title, value || 'Nao informado']);
    sections.push(block('Contexto da coleta', table(['Item', 'Registro'], contextRows)),
      ...(input.instruments?.length ? [block('Instrumentos', table(['Instrumento', 'Resolucao', 'Unidade'], input.instruments.map(i => [i.name, fmt(i.resolution), i.unit])))] : []));
  }
  if (enabled(row, 'conclusion')) sections.push(textBlocks('Conclusao profissional', input.professionalConclusion || 'Conclusao profissional nao registrada.'));
  return anthropometryDashboardHtml(s) + page('Antropometria - detalhamento', meta + sections.join('') + analysisHtml);
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
