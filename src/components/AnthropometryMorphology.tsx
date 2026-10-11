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
  return <g data-body-sex={female ? 'F' : 'M'} data-body-source="Wikimedia Commons CC0">
    <path d="M320 39 H282 Q248 39 248 75 V304 Q248 338 282 338 H320 Z" fill="#f8e9eb" />
    <path d="M320 39 H358 Q392 39 392 75 V304 Q392 338 358 338 H320 Z" fill="#e5f4f0" />
    <image href={asset} x="251" y="45" width="138" height="285" preserveAspectRatio="xMidYMid meet" />
    {female && <path d="M299 116 Q320 109 341 116 L339 140 Q320 146 301 140 Z" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.2" />}
    <path d={female
      ? 'M300 189 Q320 184 340 189 L337 217 Q328 224 320 216 Q312 224 303 217 Z'
      : 'M303 174 Q320 169 337 174 L334 204 Q327 211 320 203 Q313 211 306 204 Z'} fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.2" />
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

export function Somatochart({ somatotype }: { somatotype: AnthropometryResult['somatotype'] }) {
  const { x, y } = somatotype;
  const valid = x != null && y != null && Number.isFinite(x) && Number.isFinite(y);
  const projectX = (amount: number) => 270 + Math.max(-10, Math.min(10, amount)) / 10 * 188;
  const projectY = (amount: number) => 294 - (Math.max(-12, Math.min(18, amount)) + 12) / 30 * 242;
  return <figure style={{ margin: 0, maxWidth: 680 }}>
    <svg viewBox="0 0 540 380" role="img" aria-label="Somatocarta Heath-Carter" style={{ width: '100%', height: 'auto', display: 'block', aspectRatio: '54 / 38' }}>
      <rect width="540" height="380" rx="8" fill="#f8fafc" />
      <path d="M76 296 Q270 366 464 296 Q510 145 270 42 Q30 145 76 296 Z" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" />
      <g fill="none" stroke="#dbe4ea" strokeWidth="1.2">
        <path d="M108 278 Q270 330 432 278" /><path d="M142 252 Q270 290 398 252" /><path d="M176 219 Q270 242 364 219" />
        <path d="M101 273 Q165 151 270 42" /><path d="M439 273 Q375 151 270 42" />
        <path d="M76 296 Q270 207 464 296" /><path d="M118 185 Q270 260 422 185" />
      </g>
      <g stroke="#94a3b8" strokeWidth="1">
        <line x1={projectX(-10)} y1={projectY(0)} x2={projectX(10)} y2={projectY(0)} />
        <line x1={projectX(0)} y1={projectY(-12)} x2={projectX(0)} y2={projectY(18)} />
      </g>
      <text x="270" y="25" textAnchor="middle" fontSize="13" fontWeight="700" fill="#334155">MESOMORFIA</text>
      <text x="64" y="331" fontSize="13" fontWeight="700" fill="#9f3f4f">ENDOMORFIA</text>
      <text x="476" y="331" textAnchor="end" fontSize="13" fontWeight="700" fill="#087f6d">ECTOMORFIA</text>
      <text x="270" y="369" textAnchor="middle" fontSize="11" fill="#64748b">X = ectomorfia - endomorfia; Y = 2 x mesomorfia - endomorfia - ectomorfia</text>
      {valid && <g data-somatotype-point>
        <circle cx={projectX(x)} cy={projectY(y)} r="12" fill="#0f766e" opacity="0.18" />
        <circle cx={projectX(x)} cy={projectY(y)} r="6" fill="#0f766e" stroke="#ffffff" strokeWidth="2"><title>{`X ${fmt(x)}; Y ${fmt(y)}`}</title></circle>
      </g>}
    </svg>
    <figcaption style={{ fontSize: 12, color: '#475569', marginTop: 8 }}>
      {valid ? `X: ${fmt(x)}; Y: ${fmt(y)}. ${somatotype.classification ?? ''}` : somatotype.reason || 'Somatotipo indisponivel.'}
    </figcaption>
  </figure>;
}
