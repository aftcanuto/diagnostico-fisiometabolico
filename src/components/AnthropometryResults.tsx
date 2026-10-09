import type { CSSProperties } from 'react';
import { CORRECTED_GIRTH_RESULT_IDS, type calculateAnthropometry } from '@/lib/anthropometry';

export type AnthropometryResult = ReturnType<typeof calculateAnthropometry>;
export type AnthropometryHistoryEntry = { id: string; date: string; results: AnthropometryResult };
type ResultRow = AnthropometryResult['results'][number];
type Reference = AnthropometryResult['references'][number];

export const anthropometryFormat = (value: number | null | undefined, digits = 2) =>
  value == null || !Number.isFinite(value) ? 'Nao disponivel' : value.toLocaleString('pt-BR', { maximumFractionDigits: digits });
export const anthropometryDate = (date: string) => /^\d{4}-\d{2}-\d{2}$/.test(date) ? date.split('-').reverse().join('/') : date;
const statusLabels = { available: 'Disponivel', missing: 'Faltam dados', review: 'Revisao necessaria', invalid: 'Invalido' };
const cell: CSSProperties = { padding: '10px 8px', borderBottom: '1px solid #e5e7eb', verticalAlign: 'top', textAlign: 'left' };
const section: CSSProperties = { padding: '20px 0', borderTop: '1px solid #e5e7eb', minWidth: 0 };
const heading: CSSProperties = { fontSize: 18, fontWeight: 600, marginBottom: 12 };

export function ReferenceLinks({ ids, references }: { ids: string[]; references: Reference[] }) {
  return <span className="inline-flex flex-wrap gap-x-2 gap-y-1" style={{ fontSize: 12 }}>
    {[...new Set(ids)].map(id => {
      const ref = references.find(item => item.id === id);
      const url = ref?.url && /^https?:\/\//i.test(ref.url) ? ref.url : null;
      return url ? <a key={id} href={url} target="_blank" rel="noopener noreferrer" title={ref?.text} style={{ color: '#0369a1', textDecoration: 'underline', overflowWrap: 'anywhere' }}>{id}</a>
        : <span key={id} title={ref?.text}>{id}</span>;
    })}
  </span>;
}

export function Somatochart({ somatotype }: { somatotype: AnthropometryResult['somatotype'] }) {
  const { x, y } = somatotype;
  const valid = x != null && y != null && Number.isFinite(x) && Number.isFinite(y);
  const extent = valid ? Math.max(12, Math.ceil(Math.max(Math.abs(x), Math.abs(y)) / 4) * 4) : 12;
  const projectX = (value: number) => 240 + value / extent * 185;
  const projectY = (value: number) => 205 - value / extent * 155;
  return <figure style={{ margin: 0, maxWidth: 600 }}>
    <svg viewBox="0 0 480 410" role="img" aria-label="Somatocarta Heath-Carter" style={{ width: '100%', height: 'auto', display: 'block', aspectRatio: '48 / 41' }}>
      <rect x="0" y="0" width="480" height="410" fill="#fff" />
      {[-1, -0.5, 0, 0.5, 1].map(fraction => <g key={fraction}>
        <line x1={projectX(fraction * extent)} x2={projectX(fraction * extent)} y1="50" y2="360" stroke="#e5e7eb" />
        <line x1="55" x2="425" y1={projectY(fraction * extent)} y2={projectY(fraction * extent)} stroke="#e5e7eb" />
        <text x={projectX(fraction * extent)} y="380" textAnchor="middle" fontSize="11" fill="#4b5563">{anthropometryFormat(fraction * extent, 0)}</text>
        <text x="44" y={projectY(fraction * extent) + 4} textAnchor="end" fontSize="11" fill="#4b5563">{anthropometryFormat(fraction * extent, 0)}</text>
      </g>)}
      <line x1="55" y1="205" x2="425" y2="205" stroke="#6b7280" />
      <line x1="240" y1="50" x2="240" y2="360" stroke="#6b7280" />
      <text x="240" y="24" textAnchor="middle" fontSize="13" fill="#374151">Mesomorfia (Y)</text>
      <text x="65" y="401" textAnchor="start" fontSize="12" fill="#374151">Endomorfia</text>
      <text x="415" y="401" textAnchor="end" fontSize="12" fill="#374151">Ectomorfia (X)</text>
      {valid && <circle data-somatotype-point cx={projectX(x)} cy={projectY(y)} r="7" fill="#0f766e" stroke="#fff" strokeWidth="2"><title>{`X ${anthropometryFormat(x)}; Y ${anthropometryFormat(y)}`}</title></circle>}
    </svg>
    <figcaption style={{ fontSize: 12, color: '#4b5563' }}>{valid ? `X: ${anthropometryFormat(x)}; Y: ${anthropometryFormat(y)}. ${somatotype.classification ?? ''}` : somatotype.reason || 'Somatotipo indisponivel.'}</figcaption>
  </figure>;
}

export function PhantomChart({ rows }: { rows: ResultRow[] }) {
  const numeric = rows.filter(row => row.value != null && Number.isFinite(row.value));
  const extent = Math.max(3, ...numeric.map(row => Math.ceil(Math.abs(row.value!))));
  return <div style={{ minWidth: 0 }} aria-label="Proporcionalidade Phantom">
    <p style={{ fontSize: 12, marginBottom: 12, color: '#4b5563' }}>Z-scores de proporcionalidade; nao representam diagnostico ou faixa de normalidade.</p>
    {rows.map(row => <div key={row.id} data-phantom-id={row.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(90px, 1fr) minmax(70px, 2fr) 54px', gap: 10, alignItems: 'center', marginBottom: 10, fontSize: 12 }}>
      <span style={{ overflowWrap: 'anywhere' }}>{row.label}</span>
      <div style={{ position: 'relative', height: 18, background: '#f3f4f6' }}>
        <span style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: '#6b7280' }} />
        {row.value != null && Number.isFinite(row.value) && <span style={{ position: 'absolute', top: 3, height: 12, left: row.value < 0 ? `${50 + row.value / extent * 50}%` : '50%', width: `${Math.abs(row.value) / extent * 50}%`, background: row.value < 0 ? '#0284c7' : '#0f766e' }} />}
      </div>
      <span style={{ textAlign: 'right' }}>{row.value == null ? '-' : anthropometryFormat(row.value)}</span>
    </div>)}
    <p style={{ textAlign: 'center', fontSize: 11, color: '#4b5563' }}>Escala: {anthropometryFormat(-extent)} a +{anthropometryFormat(extent)}; centro Z = 0</p>
  </div>;
}

function ResultsTable({ rows, snapshot }: { rows: ResultRow[]; snapshot: AnthropometryResult }) {
  const method = (row: ResultRow) => <>
    <div>{snapshot.methodMeta.find(item => item.id === row.methodId)?.label ?? row.methodId}</div>
    <div style={{ fontSize: 11, color: '#4b5563' }}>Versao {row.methodVersion}</div>
    <ReferenceLinks ids={row.referenceIds} references={snapshot.references} />
    {Object.keys(row.inputs).length > 0 && <details style={{ marginTop: 6 }}><summary>Entradas utilizadas</summary><dl>{Object.entries(row.inputs).map(([key, value]) => <div key={key} style={{ overflowWrap: 'anywhere' }}><dt style={{ display: 'inline' }}>{key}: </dt><dd style={{ display: 'inline', margin: 0 }}>{typeof value === 'number' ? anthropometryFormat(value, 6) : value == null ? 'Ausente' : String(value)}</dd></div>)}</dl></details>}
  </>;
  return <>
    <div className="md:hidden" style={{ width: '100%', minWidth: 0 }}>
      {rows.map(row => <div key={row.id} data-result-id={row.id} style={{ padding: '12px 0', borderBottom: '1px solid #e5e7eb', minWidth: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 12, alignItems: 'start' }}>
          <strong style={{ fontSize: 13, overflowWrap: 'anywhere' }}>{row.label}</strong>
          <span style={{ fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{anthropometryFormat(row.value)}{row.value != null ? ` ${row.unit}` : ''}</span>
        </div>
        <div style={{ fontSize: 12, marginTop: 5, color: row.status === 'invalid' ? '#b91c1c' : row.status === 'review' ? '#92400e' : '#4b5563' }}>{statusLabels[row.status]}{row.classification ? `; ${row.classification}` : ''}</div>
        {row.reason && <p style={{ margin: '5px 0 0', fontSize: 12, overflowWrap: 'anywhere' }}>{row.reason}</p>}
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px dashed #e5e7eb', fontSize: 12, minWidth: 0, overflowWrap: 'anywhere' }}>{method(row)}</div>
      </div>)}
    </div>
    <div className="hidden md:block overflow-x-auto" style={{ overflowX: 'auto', width: '100%', maxWidth: '100%', minWidth: 0 }}><table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
      <thead><tr>{['Resultado', 'Valor', 'Metodo e referencia'].map(label => <th key={label} style={cell}>{label}</th>)}</tr></thead>
      <tbody>{rows.map(row => <tr key={row.id} data-result-id={row.id}>
        <td style={{ ...cell, minWidth: 150 }}><strong>{row.label}</strong><div style={{ fontSize: 12, marginTop: 4, color: row.status === 'invalid' ? '#b91c1c' : row.status === 'review' ? '#92400e' : '#4b5563' }}>{statusLabels[row.status]}{row.classification ? `; ${row.classification}` : ''}</div>{row.reason && <p style={{ marginTop: 4, fontSize: 12 }}>{row.reason}</p>}</td>
        <td style={{ ...cell, minWidth: 90, fontVariantNumeric: 'tabular-nums' }}>{anthropometryFormat(row.value)}{row.value != null ? ` ${row.unit}` : ''}</td>
        <td style={{ ...cell, minWidth: 180 }}>{method(row)}</td>
      </tr>)}</tbody>
    </table></div>
  </>;
}

export function AnthropometryResults({ results, history = [], selectedOnly = true }: { results: AnthropometryResult; history?: AnthropometryHistoryEntry[]; selectedOnly?: boolean }) {
  const rows = results.results.filter(row => !selectedOnly || row.selected);
  const correctedIds = new Set<string>(CORRECTED_GIRTH_RESULT_IDS);
  const correctedGirths = rows.filter(row => correctedIds.has(row.id));
  const remainingRows = rows.filter(row => !correctedIds.has(row.id));
  const phantom = results.phantom.filter(row => !selectedOnly || row.selected);
  const usedIds = new Set([...rows, ...phantom].flatMap(row => row.referenceIds));
  const references = results.references.filter(reference => usedIds.has(reference.id));
  const showSomato = !selectedOnly || rows.some(row => /heath|somato/i.test(row.methodId));
  return <div aria-label="Resultados de Antropometria" style={{ width: '100%', maxWidth: '100%', minWidth: 0, overflow: 'hidden', color: '#1f2937', letterSpacing: 0 }}>
    {correctedGirths.length > 0 && <section data-anthropometry-section="corrected-girths" style={section}>
      <h2 style={heading}>Perimetros corrigidos</h2>
      <p style={{ fontSize: 12, color: '#4b5563', marginBottom: 12 }}>Valores derivados por perimetro - pi x dobra cutanea / 10. Medidas brutas permanecem preservadas; o antebraco nao recebe correcao por nao haver dobra correspondente no protocolo.</p>
      <ResultsTable rows={correctedGirths} snapshot={results} />
    </section>}
    <section data-anthropometry-section="results" style={section}>
      <h2 style={heading}>Resultados de Antropometria</h2>
      <p style={{ fontSize: 12, color: '#4b5563', marginBottom: 12 }}>Motor {results.engineVersion}; catalogo {results.catalogVersion}. {selectedOnly ? 'Metodos selecionados.' : 'Revisao de todos os metodos.'}</p>
      {remainingRows.length ? <ResultsTable rows={remainingRows} snapshot={results} /> : <p>Nenhum outro resultado selecionado.</p>}
    </section>
    {showSomato && <section data-anthropometry-section="somatotype" style={section}><h2 style={heading}>Somatotipo e somatocarta</h2><p style={{ fontSize: 13 }}>Endomorfia: {anthropometryFormat(results.somatotype.endomorphy)}; mesomorfia: {anthropometryFormat(results.somatotype.mesomorphy)}; ectomorfia: {anthropometryFormat(results.somatotype.ectomorphy)}.</p><Somatochart somatotype={results.somatotype} /><p style={{ fontSize: 12 }}>{results.somatotype.reason}</p></section>}
    {phantom.length > 0 && <section data-anthropometry-section="phantom" style={section}><h2 style={heading}>Proporcionalidade Phantom</h2><PhantomChart rows={phantom} /><ResultsTable rows={phantom} snapshot={results} /></section>}
    {history.length > 0 && <section data-anthropometry-section="history" style={section}><h2 style={heading}>Historico de avaliacoes</h2><div className="overflow-x-auto" style={{ overflowX: 'auto', width: '100%', maxWidth: '100%', minWidth: 0 }}><table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}><thead><tr><th style={cell}>Resultado</th>{history.map(item => <th key={item.id} style={cell}>{anthropometryDate(item.date)}<div style={{ fontWeight: 400 }}>Motor {item.results.engineVersion}</div></th>)}</tr></thead><tbody>{rows.map(row => <tr key={row.id}><th style={cell}>{row.label} ({row.unit})</th>{history.map(item => {
      const old = item.results.results.find(candidate => candidate.id === row.id);
      const compatible = old?.methodVersion === row.methodVersion && old?.methodId === row.methodId && item.results.engineVersion === results.engineVersion;
      return <td key={item.id} style={cell}>{anthropometryFormat(old?.value)}<div style={{ fontSize: 11 }}>{old ? `Versao ${old.methodVersion}` : 'Ausente'}{old && !compatible ? '; metodo ou motor diferente' : ''}</div></td>;
    })}</tr>)}</tbody></table></div><p style={{ fontSize: 12, marginTop: 8 }}>Valores originais preservados. Diferencas de metodo, protocolo e versao exigem revisao de comparabilidade.</p></section>}
    {references.length > 0 && <section data-anthropometry-section="references" style={section}><h2 style={heading}>Referencias utilizadas</h2><ol style={{ paddingLeft: 20, fontSize: 12 }}>{references.map(reference => <li key={reference.id} data-reference-id={reference.id} style={{ paddingBottom: 10, overflowWrap: 'anywhere' }}>{reference.text}{reference.url && /^https?:\/\//i.test(reference.url) && <> <a href={reference.url} target="_blank" rel="noopener noreferrer" style={{ color: '#0369a1', textDecoration: 'underline' }}>Consultar fonte</a></>}</li>)}</ol></section>}
  </div>;
}

export default AnthropometryResults;
