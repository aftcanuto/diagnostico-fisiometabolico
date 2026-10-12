import React from 'react';
import type { calculateAnthropometry } from '@/lib/anthropometry';
import { FEMALE_BODY_MODEL_DATA_URI, MALE_BODY_MODEL_DATA_URI } from '@/lib/anthropometry/body-assets.generated';

type AnthropometryResult = ReturnType<typeof calculateAnthropometry>;

type ResultRow = AnthropometryResult['results'][number];

const fmt = (value: number | null | undefined) => value == null || !Number.isFinite(value)
  ? '-'
  : value.toLocaleString('pt-BR', { maximumFractionDigits: 1 });

function value(rows: ResultRow[], id: string) {
  const result = rows.find(row => row.id === id);
  return result && typeof result.value === 'number' && Number.isFinite(result.value) ? result.value : null;
}

function ClinicalBodyFigure({ sex }: { sex: string }) {
  const female = sex === 'F';
  const asset = female ? FEMALE_BODY_MODEL_DATA_URI : MALE_BODY_MODEL_DATA_URI;
  return <g data-body-sex={female ? 'F' : 'M'} data-body-source="MedFit original clinical model">
    <path d="M320 39 H282 Q248 39 248 75 V304 Q248 338 282 338 H320 Z" fill="#f8e9eb" />
    <path d="M320 39 H358 Q392 39 392 75 V304 Q392 338 358 338 H320 Z" fill="#e5f4f0" />
    <image href={asset} x="251" y="45" width="138" height="285" preserveAspectRatio="xMidYMid meet" />
    <line x1="320" y1="40" x2="320" y2="337" stroke="#ffffff" strokeWidth="2" opacity="0.92" />
  </g>;
}

export function RegionalBodyMap({ rows, sex }: { rows: ResultRow[]; sex: string }) {
  const adipose = [
    ['Superior', value(rows, 'regionalAdiposityUpper')],
    ['Central', value(rows, 'regionalAdiposityCentral')],
    ['Inferior', value(rows, 'regionalAdiposityLower')],
  ] as const;
  const muscular = [
    ['Braco', value(rows, 'regionalMuscularityArm')],
    ['Coxa', value(rows, 'regionalMuscularityThigh')],
    ['Panturrilha', value(rows, 'regionalMuscularityCalf')],
  ] as const;
  const available = [...adipose, ...muscular].some(([, amount]) => amount != null);
  if (!available) return <p style={{ fontSize: 13, color: '#64748b' }}>Indicadores regionais indisponiveis para esta coleta.</p>;

  return <figure style={{ margin: 0, minWidth: 0 }}>
    <div className="hidden sm:block"><svg viewBox="0 0 640 360" role="img" aria-label="Distribuicao antropometrica regional" style={{ width: '100%', maxWidth: 720, height: 'auto', display: 'block', margin: '0 auto' }}>
      <rect width="640" height="360" fill="#f8fafc" rx="8" />
      <text x="34" y="30" fontSize="13" fontWeight="700" fill="#9f3f4f">ADIPOSIDADE RELATIVA</text>
      <text x="606" y="30" textAnchor="end" fontSize="13" fontWeight="700" fill="#087f6d">MUSCULARIDADE RELATIVA</text>
      <ClinicalBodyFigure sex={sex} />
      <g fill="none" stroke="#a94f5c" strokeWidth="1.5">
        <path d="M278 110 H170" /><path d="M286 184 H170" /><path d="M292 278 H170" />
      </g>
      <g fill="none" stroke="#087f6d" strokeWidth="1.5">
        <path d="M366 120 H470" /><path d="M350 235 H470" /><path d="M356 302 H470" />
      </g>
      {adipose.map(([label, amount], index) => <g key={label} transform={`translate(34 ${94 + index * 84})`}>
        <text fontSize="12" fill="#64748b">{label}</text>
        <text y="23" fontSize="22" fontWeight="700" fill="#9f3f4f">{fmt(amount)}%</text>
      </g>)}
      {muscular.map(([label, amount], index) => <g key={label} transform={`translate(478 ${104 + index * 91})`}>
        <text fontSize="12" fill="#64748b">{label}</text>
        <text y="23" fontSize="22" fontWeight="700" fill="#087f6d">{fmt(amount)}%</text>
      </g>)}
      <g fill="none" stroke="#147d6f" strokeWidth="2" opacity="0.8">
        <path d="M337 102 Q352 119 341 143" /><path d="M334 174 Q352 190 340 210" />
        <path d="M339 239 Q350 260 340 284" /><path d="M336 291 Q347 306 339 320" />
      </g>
    </svg></div>
    <div className="sm:hidden" aria-label="Distribuicao antropometrica regional">
      <svg viewBox="210 20 220 320" role="img" aria-label="Modelo anatomico regional" style={{ width: 150, height: 'auto', display: 'block', margin: '0 auto 12px' }}>
        <ClinicalBodyFigure sex={sex} />
      </svg>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 16 }}>
        <div>
          <h3 style={{ margin: '0 0 8px', fontSize: 11, color: '#9f3f4f' }}>ADIPOSIDADE RELATIVA</h3>
          {adipose.map(([label, amount]) => <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '7px 0', borderBottom: '1px solid #f1d5d9', fontSize: 12 }}><span>{label}</span><strong style={{ color: '#9f3f4f' }}>{fmt(amount)}%</strong></div>)}
        </div>
        <div>
          <h3 style={{ margin: '0 0 8px', fontSize: 11, color: '#087f6d' }}>MUSCULARIDADE RELATIVA</h3>
          {muscular.map(([label, amount]) => <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '7px 0', borderBottom: '1px solid #cce8e1', fontSize: 12 }}><span>{label}</span><strong style={{ color: '#087f6d' }}>{fmt(amount)}%</strong></div>)}
        </div>
      </div>
    </div>
    <figcaption style={{ fontSize: 12, lineHeight: 1.5, color: '#64748b', marginTop: 10 }}>
      Distribuicao descritiva. Adiposidade: participacao dos pares de dobras na soma de seis dobras. Muscularidade: participacao de braco, coxa e panturrilha corrigidos na soma desses tres perimetros. Nao corresponde a massa tecidual regional medida.
    </figcaption>
  </figure>;
}

export function Somatochart({ somatotype, sex = 'M' }: { somatotype: AnthropometryResult['somatotype']; sex?: string }) {
  const { x, y } = somatotype;
  const model = sex === 'F' ? FEMALE_BODY_MODEL_DATA_URI : MALE_BODY_MODEL_DATA_URI;
  const valid = x != null && y != null && Number.isFinite(x) && Number.isFinite(y);
  const projectX = (amount: number) => 175 + Math.max(-10, Math.min(10, amount)) / 10 * 112;
  const projectY = (amount: number) => 151 - (Math.max(-12, Math.min(18, amount)) + 12) / 30 * 114;
  const components = [
    { label: 'Endomorfia', short: 'Endo', value: somatotype.endomorphy, width: 52, color: '#9f3f4f' },
    { label: 'Mesomorfia', short: 'Meso', value: somatotype.mesomorphy, width: 42, color: '#334155' },
    { label: 'Ectomorfia', short: 'Ecto', value: somatotype.ectomorphy, width: 32, color: '#087f6d' },
  ];
  return <figure style={{ margin: 0, maxWidth: 760 }}>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,280px),1fr))', gap: 16, alignItems: 'center' }}>
      <svg viewBox="0 0 350 190" role="img" aria-label="Somatocarta Heath-Carter" style={{ width: '100%', height: 'auto', display: 'block' }}>
        <path d="M46 158 Q175 188 304 158 Q328 80 175 25 Q22 80 46 158 Z" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
        <path d="M46 158 Q93 109 175 25 Q135 121 175 158 Z" fill="#f9e8eb" opacity=".8" />
        <path d="M175 25 Q257 109 304 158 L175 158 Z" fill="#e5f4f0" opacity=".9" />
        <path d="M46 158 Q175 117 304 158 Q175 187 46 158 Z" fill="#eef2f7" opacity=".9" />
        <line x1="55" y1="130" x2="295" y2="130" stroke="#cbd5e1" /><line x1="175" y1="34" x2="175" y2="158" stroke="#cbd5e1" />
        <text x="175" y="17" textAnchor="middle" fontSize="9" fontWeight="700" fill="#334155">MESOMORFIA</text>
        <text x="38" y="176" fontSize="9" fontWeight="700" fill="#9f3f4f">ENDOMORFIA</text>
        <text x="312" y="176" textAnchor="end" fontSize="9" fontWeight="700" fill="#087f6d">ECTOMORFIA</text>
        {valid && <g data-somatotype-point><circle cx={projectX(x)} cy={projectY(y)} r="10" fill="#0f766e" opacity="0.18" /><circle cx={projectX(x)} cy={projectY(y)} r="5" fill="#0f766e" stroke="#ffffff" strokeWidth="2"><title>{`X ${fmt(x)}; Y ${fmt(y)}`}</title></circle></g>}
      </svg>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 8, textAlign: 'center' }} aria-label="Modelos ilustrativos dos componentes">
        {components.map(component => <div key={component.label} style={{ minWidth: 0 }}><svg viewBox="0 0 70 124" style={{ width: '100%', height: 110 }}><image href={model} x={(70 - component.width) / 2} y="8" width={component.width} height="108" preserveAspectRatio="xMidYMid meet" /></svg><div style={{ fontSize: 11, color: component.color }}>{component.short}</div><strong style={{ display: 'block', fontSize: 16, color: '#0f172a', marginTop: 2 }}>{fmt(component.value)}</strong></div>)}
        <p style={{ gridColumn: '1 / -1', fontSize: 11, lineHeight: 1.4, color: '#64748b', margin: 0 }}>As miniaturas ilustram os componentes e nao representam o corpo real do avaliado.</p>
      </div>
    </div>
    <figcaption style={{ fontSize: 12, color: '#475569', marginTop: 8 }}>
      {valid ? `X: ${fmt(x)}; Y: ${fmt(y)}. ${somatotype.classification ?? ''}` : somatotype.reason || 'Somatotipo indisponivel.'}
    </figcaption>
  </figure>;
}
