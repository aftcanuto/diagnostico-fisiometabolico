import type { CSSProperties } from 'react';
import { CORRECTED_GIRTH_RESULT_IDS, REGIONAL_DISTRIBUTION_RESULT_IDS, type calculateAnthropometry } from '@/lib/anthropometry';
import { RegionalBodyMap, Somatochart } from './AnthropometryMorphology';

export type AnthropometryResult = ReturnType<typeof calculateAnthropometry>;
export type AnthropometryHistoryEntry = { id: string; date: string; results: AnthropometryResult };
type ResultRow = AnthropometryResult['results'][number];
type Reference = AnthropometryResult['references'][number];

export const anthropometryFormat = (value: number | null | undefined, digits = 2) =>
  value == null || !Number.isFinite(value) ? 'Nao disponivel' : value.toLocaleString('pt-BR', { maximumFractionDigits: digits });
export const anthropometryDate = (date: string) => /^\d{4}-\d{2}-\d{2}$/.test(date) ? date.split('-').reverse().join('/') : date;
const statusLabels = { available: 'Disponivel', missing: 'Faltam dados', review: 'Calculado com ressalva', invalid: 'Invalido' };
const cell: CSSProperties = { padding: '10px 8px', borderBottom: '1px solid #e5e7eb', verticalAlign: 'top', textAlign: 'left' };
const section: CSSProperties = { padding: '20px 0', borderTop: '1px solid #e5e7eb', minWidth: 0 };
const heading: CSSProperties = { fontSize: 18, fontWeight: 600, marginBottom: 12 };

function CompositionSummary({ rows }: { rows: ResultRow[] }) {
  const value = (ids: string[]) => ids.map(id => rows.find(row => row.id === id && typeof row.value === 'number' && Number.isFinite(row.value))).find(Boolean);
  const muscle = value(['lee2000', 'martin1990', 'kerrMuscle1988']);
  const adipose = value(['kerrAdipose1988', 'fatMass']);
  const bone = value(['martinBone1991', 'rocha1975']);
  const percentages = [
    value(['kerrAdipose1988Percent', 'fatPercent'])?.value,
    value(['lee2000Percent', 'martin1990Percent', 'kerrMuscle1988Percent'])?.value,
    value(['martinBone1991Percent', 'rocha1975Percent'])?.value,
  ];
  const complete = percentages.every(item => typeof item === 'number' && Number.isFinite(item) && item >= 0);
  const subtotal = complete ? percentages.reduce<number>((sum, item) => sum + Number(item), 0) : 0;
  const parts = complete && subtotal <= 100
    ? [...percentages.map(Number), 100 - subtotal]
    : complete && subtotal > 0
      ? [...percentages.map(item => Number(item) / subtotal * 100), 0]
      : [];
  if (!muscle && !adipose && !bone) return null;
  const labels = ['Adiposa', 'Muscular', 'Ossea', 'Residual'];
  const colors = ['#b75b6b', '#168b76', '#6686a8', '#d6b66d'];
  return <section data-anthropometry-section="composition-summary" style={{ ...section, borderTop: 0, paddingTop: 4 }}>
    <h2 style={heading}>Resumo da composicao corporal</h2>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 10, marginBottom: 14 }}>
      {[['Massa muscular', muscle], ['Massa adiposa', adipose], ['Massa ossea', bone]].map(([label, row]) => <div key={String(label)} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, background: '#f8fafc' }}><div style={{ fontSize: 11, color: '#64748b' }}>{String(label)}</div><strong style={{ display: 'block', fontSize: 20, marginTop: 4 }}>{row ? `${anthropometryFormat((row as ResultRow).value)} kg` : 'Nao disponivel'}</strong></div>)}
    </div>
    {complete ? <><div data-tissue-total="100" style={{ height: 18, display: 'flex', overflow: 'hidden', borderRadius: 999, background: '#e2e8f0' }}>{parts.map((part, index) => <span key={labels[index]} style={{ width: `${Math.max(0, part)}%`, background: colors[index] }} />)}</div><div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 8, marginTop: 8 }}>{labels.map((label, index) => <div key={label} style={{ fontSize: 11, color: '#64748b' }}><span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: 2, background: colors[index], marginRight: 4 }} />{label}<strong style={{ display: 'block', color: '#334155', marginTop: 3 }}>{anthropometryFormat(parts[index], 1)}%</strong></div>)}</div><p style={{ fontSize: 11, color: '#64748b', marginTop: 9 }}>Total: 100%. O componente residual completa a massa corporal nao atribuida as estimativas adiposa, muscular e ossea.</p></> : <p style={{ fontSize: 12, color: '#64748b' }}>O fracionamento percentual requer estimativas selecionadas de massa adiposa, muscular e ossea.</p>}
  </section>;
}

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
  const regionalIds = new Set<string>(REGIONAL_DISTRIBUTION_RESULT_IDS);
  const correctedGirths = rows.filter(row => correctedIds.has(row.id));
  const regionalRows = rows.filter(row => regionalIds.has(row.id));
  const remainingRows = rows.filter(row => !correctedIds.has(row.id) && !regionalIds.has(row.id));
  const phantom = results.phantom.filter(row => !selectedOnly || row.selected);
  const usedIds = new Set([...rows, ...phantom].flatMap(row => row.referenceIds));
  const references = results.references.filter(reference => usedIds.has(reference.id));
  const showSomato = !selectedOnly || rows.some(row => /heath|somato/i.test(row.methodId));
  return <div aria-label="Resultados de Antropometria" style={{ width: '100%', maxWidth: '100%', minWidth: 0, overflow: 'hidden', color: '#1f2937', letterSpacing: 0 }}>
    <CompositionSummary rows={rows} />
    {correctedGirths.length > 0 && <section data-anthropometry-section="corrected-girths" style={section}>
      <h2 style={heading}>Perimetros corrigidos</h2>
      <p style={{ fontSize: 12, color: '#4b5563', marginBottom: 12 }}>Valores derivados por perimetro - pi x dobra cutanea / 10. Medidas brutas permanecem preservadas; o antebraco nao recebe correcao por nao haver dobra correspondente no protocolo.</p>
      <ResultsTable rows={correctedGirths} snapshot={results} />
    </section>}
    {regionalRows.some(row => row.value != null) && <section data-anthropometry-section="regional-distribution" style={section}>
      <h2 style={heading}>Distribuicao antropometrica regional</h2>
      <RegionalBodyMap rows={regionalRows} sex={results.context.sex} />
    </section>}
    <section data-anthropometry-section="results" style={section}>
      <h2 style={heading}>Resultados de Antropometria</h2>
      <p style={{ fontSize: 12, color: '#4b5563', marginBottom: 12 }}>Motor {results.engineVersion}; catalogo {results.catalogVersion}. {selectedOnly ? 'Metodos selecionados.' : 'Revisao de todos os metodos.'}</p>
      {remainingRows.length ? <ResultsTable rows={remainingRows} snapshot={results} /> : <p>Nenhum outro resultado selecionado.</p>}
    </section>
    {showSomato && <section data-anthropometry-section="somatotype" style={section}><h2 style={heading}>Somatotipo e somatocarta</h2><p style={{ fontSize: 13 }}>Endomorfia: {anthropometryFormat(results.somatotype.endomorphy)}; mesomorfia: {anthropometryFormat(results.somatotype.mesomorphy)}; ectomorfia: {anthropometryFormat(results.somatotype.ectomorphy)}.</p><Somatochart somatotype={results.somatotype} sex={results.context.sex} /><p style={{ fontSize: 12 }}>{results.somatotype.reason}</p></section>}
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
