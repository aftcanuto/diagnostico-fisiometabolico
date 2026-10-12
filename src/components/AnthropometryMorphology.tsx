import React from 'react';
import type { calculateAnthropometry } from '@/lib/anthropometry';
import { FEMALE_BODY_MODEL_DATA_URI, MALE_BODY_MODEL_DATA_URI } from '@/lib/anthropometry/body-assets.generated';
import { classifySomatotype } from '@/lib/anthropometry/formulas';
import { somatotypeFigure, type SomatotypeProfile } from '@/lib/anthropometry/somatotype-figures';

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

export function Somatochart({ somatotype, sex }: { somatotype: AnthropometryResult['somatotype']; sex?: string }) {
  const { x, y } = somatotype;
  const valid = x != null && y != null && Number.isFinite(x) && Number.isFinite(y);
  const classification = [somatotype.endomorphy, somatotype.mesomorphy, somatotype.ectomorphy].every(v => typeof v === 'number' && Number.isFinite(v))
    ? classifySomatotype(somatotype.endomorphy!, somatotype.mesomorphy!, somatotype.ectomorphy!)
    : somatotype.classification;
  const projectX = (amount: number) => 175 + Math.max(-10, Math.min(10, amount)) / 10 * 112;
  const projectY = (amount: number) => 151 - (Math.max(-12, Math.min(18, amount)) + 12) / 30 * 114;
  const profile = (kind: SomatotypeProfile, x: number, y: number, label: string, color: string) => {
    const figure = somatotypeFigure(kind, sex);
    const skin = '#d99670';
    return <g transform={`translate(${x} ${y})`} aria-label={`Perfil corporal ${label}`}>
      <g transform="scale(.39 .49) translate(-30 -72)">
        <ellipse {...figure.head} fill={skin} />
        <path d={figure.neck} fill={skin} />
        <path d={figure.leftArm} fill={skin} /><path d={figure.rightArm} fill={skin} />
        <path d={figure.leftLeg} fill={skin} /><path d={figure.rightLeg} fill={skin} />
        <path d={figure.torso} fill={skin} />
        <path d={figure.pelvis} fill={skin} />
        <path d={figure.garment} fill={color} opacity=".92" />
        <path d="M26 7 Q30 3 34 7" fill="none" stroke="#7c4b3a" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="30" y1="29" x2="30" y2="66" stroke="#9b654e" strokeWidth=".8" opacity=".55" />
      </g>
      <text y="48" textAnchor="middle" fontSize="8" fontWeight="700" fill={color}>{label}</text>
    </g>;
  };
  return <figure style={{ margin: 0, maxWidth: 760 }}>
    <svg viewBox="0 0 350 210" role="img" aria-label="Somatocarta Heath-Carter" style={{ width: '100%', height: 'auto', display: 'block' }}>
        <path d="M46 158 Q175 188 304 158 Q328 80 175 25 Q22 80 46 158 Z" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
        <path d="M46 158 Q93 109 175 25 Q135 121 175 158 Z" fill="#f9e8eb" opacity=".8" />
        <path d="M175 25 Q257 109 304 158 L175 158 Z" fill="#e5f4f0" opacity=".9" />
        <path d="M46 158 Q175 117 304 158 Q175 187 46 158 Z" fill="#eef2f7" opacity=".9" />
        <line x1="55" y1="130" x2="295" y2="130" stroke="#cbd5e1" /><line x1="175" y1="34" x2="175" y2="158" stroke="#cbd5e1" />
        <text x="175" y="17" textAnchor="middle" fontSize="9" fontWeight="700" fill="#334155">MESOMORFIA</text>
        <text x="38" y="176" fontSize="9" fontWeight="700" fill="#9f3f4f">ENDOMORFIA</text>
        <text x="312" y="176" textAnchor="end" fontSize="9" fontWeight="700" fill="#087f6d">ECTOMORFIA</text>
        {profile('endo', 76, 91, 'Endo', '#9f3f4f')}
        {profile('meso', 175, 82, 'Meso', '#334155')}
        {profile('ecto', 274, 91, 'Ecto', '#087f6d')}
        {valid && <g data-somatotype-point><circle cx={projectX(x)} cy={projectY(y)} r="10" fill="#0f766e" opacity="0.18" /><circle cx={projectX(x)} cy={projectY(y)} r="5" fill="#0f766e" stroke="#ffffff" strokeWidth="2"><title>{`X ${fmt(x)}; Y ${fmt(y)}`}</title></circle></g>}
      </svg>
    <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, textAlign:'center', marginTop:6, fontSize:12 }}>
      <span><b style={{color:'#9f3f4f'}}>Endomorfia</b><br/>{fmt(somatotype.endomorphy)}</span>
      <span><b style={{color:'#334155'}}>Mesomorfia</b><br/>{fmt(somatotype.mesomorphy)}</span>
      <span><b style={{color:'#087f6d'}}>Ectomorfia</b><br/>{fmt(somatotype.ectomorphy)}</span>
    </div>
    <figcaption style={{ fontSize: 12, color: '#475569', marginTop: 8 }}>
      {valid ? `X: ${fmt(x)}; Y: ${fmt(y)}. ${classification ?? ''}` : somatotype.reason || 'Somatotipo indisponivel.'}
    </figcaption>
  </figure>;
}
