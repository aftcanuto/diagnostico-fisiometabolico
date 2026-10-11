import { qualificationLabel } from '@/lib/isak-qualification';
import { compareAnthropometry, CORRECTED_GIRTH_RESULT_IDS, MEASUREMENTS, REGIONAL_DISTRIBUTION_RESULT_IDS, type AnthropometryInput, type AnthropometryResults, type Result } from '@/lib/anthropometry';
import { FEMALE_BODY_MODEL_DATA_URI, MALE_BODY_MODEL_DATA_URI } from '@/lib/anthropometry/body-assets.generated';

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

function bodyModelDataUri(sex: string): string {
  return sex === 'F' ? FEMALE_BODY_MODEL_DATA_URI : MALE_BODY_MODEL_DATA_URI;
}

function dashboardBodyHtml(sex: string): string {
  const female = sex === 'F';
  const model = bodyModelDataUri(sex);
  const clothing = `${female ? '<path d="M299 116 Q320 109 341 116 L339 140 Q320 146 301 140 Z" fill="#fff" stroke="#cbd5e1" stroke-width="1.2"/>' : ''}<path d="${female ? 'M300 189 Q320 184 340 189 L337 217 Q328 224 320 216 Q312 224 303 217 Z' : 'M303 174 Q320 169 337 174 L334 204 Q327 211 320 203 Q313 211 306 204 Z'}" fill="#fff" stroke="#cbd5e1" stroke-width="1.2"/>`;
  return `<svg role="img" aria-label="Modelo corporal ${female ? 'feminino' : 'masculino'}" data-body-sex="${female ? 'F' : 'M'}" viewBox="238 30 164 315" style="display:block;width:138px;height:265px;margin:0 auto">
    <path d="M320 39 H282 Q248 39 248 75 V304 Q248 338 282 338 H320 Z" fill="#f8e9eb"/><path d="M320 39 H358 Q392 39 392 75 V304 Q392 338 358 338 H320 Z" fill="#e5f4f0"/>
    <image href="${model}" x="251" y="45" width="138" height="285" preserveAspectRatio="xMidYMid meet"/>${clothing}<line x1="320" y1="40" x2="320" y2="337" stroke="#fff" stroke-width="2" opacity=".92"/>
  </svg>`;
}

function anthropometryDashboardHtml(snapshot: Snapshot): string {
  const rows = selected(snapshot);
  const result = (id: string) => rows.find(item => item.id === id && withValue(item));
  const measurement = (id: keyof Snapshot['measurements']) => snapshot.measurements?.[id]?.value ?? null;
  const fat = result('fatPercent');
  const lean = result('fatFreePercent');
  const bmi = result('bmiClassification') ?? result('bmi');
  const waistHeight = result('waistHeightRatio');
  const mass = measurement('mass');
  const height = measurement('height');
  const soma = snapshot.somatotype;
  const fatValue = fat?.value ?? null;
  const leanValue = lean?.value ?? (fatValue == null ? null : 100 - fatValue);
  const circumference = 301.59;
  const fatArc = fatValue == null ? 0 : Math.max(0, Math.min(100, fatValue)) / 100 * circumference;
  const card = (label: string, amount: number | null, unit: string, note: string) => `<div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:13px 14px;min-height:82px">
    <div style="font-size:8px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.7px">${esc(label)}</div>
    <div style="font-size:24px;font-weight:800;color:#0f172a;line-height:1.1;margin-top:6px">${fmt(amount)} <span style="font-size:10px;font-weight:500;color:#94a3b8">${esc(unit)}</span></div>
    <div style="font-size:9px;line-height:1.35;color:#64748b;margin-top:5px">${esc(note)}</div>
  </div>`;
  const regional = (ids: string[]) => ids.map(id => result(id)?.value ?? null);
  const adiposity = regional(['regionalAdiposityUpper','regionalAdiposityCentral','regionalAdiposityLower']);
  const muscularity = regional(['regionalMuscularityArm','regionalMuscularityThigh','regionalMuscularityCalf']);
  const distribution = (title: string, labels: string[], values: (number | null)[], colors: string[]) => {
    const available = values.every(value => typeof value === 'number' && Number.isFinite(value));
    return `<div style="margin-top:13px"><div style="display:flex;justify-content:space-between;align-items:end;margin-bottom:6px"><strong style="font-size:10px;color:#334155">${esc(title)}</strong><span style="font-size:8px;color:#94a3b8">distribuicao relativa</span></div>
      ${available ? `<div style="height:12px;border-radius:999px;overflow:hidden;display:flex;background:#e2e8f0">${values.map((value, index) => `<span style="width:${Math.max(0, value!)}%;background:${colors[index]}"></span>`).join('')}</div>` : '<div style="height:12px;border-radius:999px;background:#e2e8f0"></div>'}
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:6px">${labels.map((label, index) => `<div style="font-size:8px;color:#64748b"><span style="display:inline-block;width:6px;height:6px;border-radius:2px;background:${colors[index]};margin-right:4px"></span>${esc(label)} <strong style="color:#334155">${fmt(values[index])}%</strong></div>`).join('')}</div>
    </div>`;
  };
  const bmiNote = bmi?.classification || 'Indice de massa corporal';
  const waistNote = waistHeight ? `Cintura/estatura: ${fmt(waistHeight.value)}` : 'Relacao cintura/estatura indisponivel';
  const dashboard = `<div data-anthropometry-dashboard="true">
    <div style="display:flex;justify-content:space-between;gap:18px;align-items:flex-start;margin-bottom:16px">
      <div><div style="font-size:11px;font-weight:800;color:#087f6d;text-transform:uppercase;letter-spacing:1px">Resumo corporal</div><p style="font-size:11px;line-height:1.45;color:#64748b;margin:6px 0 0">Uma leitura visual dos principais resultados. Os detalhes tecnicos, metodos e medidas aparecem nas paginas seguintes.</p></div>
      <div style="font-size:9px;color:#64748b;text-align:right;white-space:nowrap">Coleta: ${esc(snapshot.calculatedAt)}</div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:9px;margin-bottom:15px">
      ${card('Gordura corporal', fatValue, '%', 'Estimativa por dobras cutaneas')}
      ${card('Massa livre de gordura', leanValue, '%', 'Complemento da gordura estimada')}
      ${card('IMC', bmi?.value ?? null, 'kg/m2', bmiNote)}
      ${card('Massa corporal', mass, 'kg', height == null ? 'Medida coletada' : `Estatura: ${fmt(height)} cm`)}
    </div>
    <div style="display:grid;grid-template-columns:190px 1fr;gap:15px;align-items:stretch">
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px 12px;text-align:center">
        ${dashboardBodyHtml(snapshot.context.sex)}
        <div style="font-size:8px;color:#94a3b8;text-transform:uppercase;letter-spacing:.6px">Perfil corporal</div>
        <div style="font-size:14px;font-weight:800;color:#0f172a;margin-top:4px">${esc(soma.classification || 'Nao calculado')}</div>
        <div style="font-size:8px;color:#64748b;line-height:1.35;margin-top:4px">Descricao morfologica; nao representa diagnostico.</div>
      </div>
      <div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:16px 18px">
        <div style="display:grid;grid-template-columns:150px 1fr;gap:17px;align-items:center">
          <div style="text-align:center">
            <svg viewBox="0 0 120 120" role="img" aria-label="Composicao corporal estimada" style="width:118px;height:118px">
              <circle cx="60" cy="60" r="48" fill="none" stroke="#d9eee9" stroke-width="13"/>
              <circle cx="60" cy="60" r="48" fill="none" stroke="#b75b6b" stroke-width="13" stroke-linecap="round" stroke-dasharray="${fatArc} ${circumference}" transform="rotate(-90 60 60)"/>
              <text x="60" y="56" text-anchor="middle" font-size="9" fill="#64748b">GORDURA</text><text x="60" y="76" text-anchor="middle" font-size="19" font-weight="800" fill="#0f172a">${fmt(fatValue)}%</text>
            </svg>
          </div>
          <div>
            <div style="font-size:13px;font-weight:800;color:#0f172a">Composicao estimada</div>
            <div style="display:flex;gap:15px;margin-top:10px;font-size:9px;color:#64748b"><span><i style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#b75b6b;margin-right:5px"></i>Gordura ${fmt(fatValue)}%</span><span><i style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#7ac7b5;margin-right:5px"></i>Livre de gordura ${fmt(leanValue)}%</span></div>
            <p style="font-size:9px;line-height:1.45;color:#64748b;margin:10px 0 0">${esc(waistNote)}. Resultados estimados por antropometria e interpretados no conjunto da avaliacao.</p>
          </div>
        </div>
        ${distribution('Adiposidade por regiao', ['Superior','Central','Inferior'], adiposity, ['#d9929e','#b75b6b','#863746'])}
        ${distribution('Muscularidade por segmento', ['Braco','Coxa','Panturrilha'], muscularity, ['#88cfc0','#42aa92','#087f6d'])}
        <div style="margin-top:14px;padding-top:11px;border-top:1px solid #e2e8f0;display:grid;grid-template-columns:repeat(3,1fr);gap:8px;text-align:center">
          <div><span style="font-size:8px;color:#94a3b8">ENDOMORFIA</span><strong style="display:block;font-size:14px;color:#334155;margin-top:3px">${fmt(soma.endomorphy)}</strong></div>
          <div><span style="font-size:8px;color:#94a3b8">MESOMORFIA</span><strong style="display:block;font-size:14px;color:#334155;margin-top:3px">${fmt(soma.mesomorphy)}</strong></div>
          <div><span style="font-size:8px;color:#94a3b8">ECTOMORFIA</span><strong style="display:block;font-size:14px;color:#334155;margin-top:3px">${fmt(soma.ectomorphy)}</strong></div>
        </div>
      </div>
    </div>
    <p style="font-size:8.5px;line-height:1.45;color:#64748b;margin:13px 2px 0">Os percentuais regionais descrevem a participacao relativa das medidas coletadas e nao equivalem a massa tecidual regional, DXA ou diagnostico. A interpretacao final deve considerar os demais modulos e o contexto clinico.</p>
  </div>`;
  return page('Antropometria', dashboard);
}

function regionalBodyHtml(rows: Result[], sex: string): string {
  const value = (id: string) => rows.find(result => result.id === id && withValue(result))?.value ?? null;
  const female = sex === 'F';
  const model = bodyModelDataUri(sex);
  const clothing = `${female ? '<path d="M299 116 Q320 109 341 116 L339 140 Q320 146 301 140 Z" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.2"/>' : ''}<path d="${female ? 'M300 189 Q320 184 340 189 L337 217 Q328 224 320 216 Q312 224 303 217 Z' : 'M303 174 Q320 169 337 174 L334 204 Q327 211 320 203 Q313 211 306 204 Z'}" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.2"/>`;
  const label = (x: number, y: number, title: string, amount: number | null, color: string, anchor = 'start') => `<g transform="translate(${x} ${y})"><text text-anchor="${anchor}" font-size="11" fill="#64748b">${esc(title)}</text><text y="22" text-anchor="${anchor}" font-size="20" font-weight="700" fill="${color}">${fmt(amount)}%</text></g>`;
  return `<div style="break-inside:avoid;page-break-inside:avoid;border:1px solid #e2e8f0;border-radius:8px;padding:10px;background:#f8fafc">
    <svg role="img" aria-label="Distribuicao antropometrica regional" data-body-sex="${female ? 'F' : 'M'}" viewBox="0 0 640 340" style="display:block;width:100%;height:285px">
      <text x="24" y="24" font-size="12" font-weight="700" fill="#9f3f4f">ADIPOSIDADE RELATIVA</text><text x="616" y="24" text-anchor="end" font-size="12" font-weight="700" fill="#087f6d">MUSCULARIDADE RELATIVA</text>
      <path d="M320 39 H282 Q248 39 248 75 V304 Q248 338 282 338 H320 Z" fill="#f8e9eb"/><path d="M320 39 H358 Q392 39 392 75 V304 Q392 338 358 338 H320 Z" fill="#e5f4f0"/>
      ${model ? `<image href="${model}" x="251" y="45" width="138" height="285" preserveAspectRatio="xMidYMid meet"/>` : ''}${clothing}<line x1="320" y1="40" x2="320" y2="337" stroke="#fff" stroke-width="2" opacity=".92"/>
      <g fill="none" stroke="#a94f5c" stroke-width="1.5"><path d="M278 105 H158"/><path d="M286 178 H158"/><path d="M292 270 H158"/></g>
      <g fill="none" stroke="#087f6d" stroke-width="1.5"><path d="M366 115 H482"/><path d="M350 228 H482"/><path d="M356 294 H482"/></g>
      ${label(24,88,'Superior',value('regionalAdiposityUpper'),'#9f3f4f')}${label(24,171,'Central',value('regionalAdiposityCentral'),'#9f3f4f')}${label(24,254,'Inferior',value('regionalAdiposityLower'),'#9f3f4f')}
      ${label(616,98,'Braco',value('regionalMuscularityArm'),'#087f6d','end')}${label(616,211,'Coxa',value('regionalMuscularityThigh'),'#087f6d','end')}${label(616,277,'Panturrilha',value('regionalMuscularityCalf'),'#087f6d','end')}
      <g fill="none" stroke="#147d6f" stroke-width="2" opacity=".8"><path d="M337 98 Q352 115 341 139"/><path d="M334 169 Q352 185 340 205"/><path d="M339 232 Q350 252 340 277"/><path d="M336 282 Q347 298 339 313"/></g>
    </svg>
    <p style="font-size:9px;line-height:1.45;color:#64748b;margin:5px 4px 0">Distribuicao descritiva. Adiposidade: participacao dos pares de dobras na soma de seis dobras. Muscularidade: participacao de braco, coxa e panturrilha corrigidos na soma desses tres perimetros. Nao corresponde a massa tecidual regional medida.</p>
  </div>`;
}

function somatochartHtml(soma: Snapshot['somatotype']): string {
  const valid = typeof soma.x === 'number' && Number.isFinite(soma.x) && typeof soma.y === 'number' && Number.isFinite(soma.y);
  const projectX = (amount: number) => 270 + Math.max(-10, Math.min(10, amount)) / 10 * 188;
  const projectY = (amount: number) => 294 - (Math.max(-12, Math.min(18, amount)) + 12) / 30 * 242;
  return `<svg role="img" aria-label="Somatocarta Heath-Carter" viewBox="0 0 540 380" style="display:block;width:100%;height:285px">
    <rect width="540" height="380" rx="8" fill="#f8fafc"/><path d="M76 296 Q270 366 464 296 Q510 145 270 42 Q30 145 76 296 Z" fill="#fff" stroke="#cbd5e1" stroke-width="2"/>
    <g fill="none" stroke="#dbe4ea" stroke-width="1.2"><path d="M108 278 Q270 330 432 278"/><path d="M142 252 Q270 290 398 252"/><path d="M176 219 Q270 242 364 219"/><path d="M101 273 Q165 151 270 42"/><path d="M439 273 Q375 151 270 42"/><path d="M76 296 Q270 207 464 296"/><path d="M118 185 Q270 260 422 185"/></g>
    <line x1="82" y1="197" x2="458" y2="197" stroke="#94a3b8"/><line x1="270" y1="52" x2="270" y2="294" stroke="#94a3b8"/>
    <text x="270" y="25" text-anchor="middle" font-size="13" font-weight="700" fill="#334155">MESOMORFIA</text><text x="64" y="331" font-size="13" font-weight="700" fill="#9f3f4f">ENDOMORFIA</text><text x="476" y="331" text-anchor="end" font-size="13" font-weight="700" fill="#087f6d">ECTOMORFIA</text>
    ${valid ? `<circle cx="${projectX(soma.x!)}" cy="${projectY(soma.y!)}" r="12" fill="#0f766e" opacity=".18"/><circle cx="${projectX(soma.x!)}" cy="${projectY(soma.y!)}" r="6" fill="#0f766e" stroke="#fff" stroke-width="2"/>` : ''}
    <text x="270" y="368" text-anchor="middle" font-size="10" fill="#64748b">X = ectomorfia - endomorfia; Y = 2 x mesomorfia - endomorfia - ectomorfia</text>
  </svg>`;
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
    if (correctedGirths.length) sections.push(block('Perimetros corrigidos',
      '<p style="font-size:10px">Derivados por perimetro - pi x dobra cutanea / 10. Medidas brutas preservadas; antebraco sem correcao por nao haver dobra correspondente.</p>' +
      table(['Resultado', 'Valor'], correctedGirths.map(result => [result.label, `${fmt(result.value)} ${result.unit}`]))));
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
    sections.push(block('Somatotipo e somatocarta', block('Somatocarta', somatochartHtml(soma)) + block('Componentes', table(['Endomorfia', 'Mesomorfia', 'Ectomorfia', 'X / Y'], [[fmt(soma.endomorphy), fmt(soma.mesomorphy), fmt(soma.ectomorphy), `${fmt(soma.x)} / ${fmt(soma.y)}`]])) + (soma.classification ? `<p style="font-size:11px">Classificacao: ${esc(soma.classification)}</p>` : '')));
  }
  if (enabled(row, 'context')) {
    const contextRows = [
    ['Contexto do calculo', `Data: ${s.context.date}; sexo: ${s.context.sex}; idade decimal: ${fmt(s.age)} anos`],
    ['Protocolo de coleta', input.collectionProtocol], ['Condicoes', input.conditions], ['Observacoes', input.notes],
    ['Categoria populacional informada', input.populationCategory === 'whiteHispanic' ? 'Branca ou hispanica' : input.populationCategory === 'africanAmerican' ? 'Negra ou afrodescendente' : input.populationCategory === 'asian' ? 'Asiatica' : 'Nao informada'],
    ['Gestacao informada', input.pregnant == null ? 'Nao informada' : input.pregnant ? 'Sim' : 'Nao'],
    ['Atividade', `Fator: ${fmt(input.activityFactor)}; justificativa: ${input.activityJustification || 'Nao informada'}`],
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
