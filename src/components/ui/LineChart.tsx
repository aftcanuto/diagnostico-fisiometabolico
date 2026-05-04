'use client';
import { useMemo } from 'react';

export interface Ponto { x: string; y: number | null; }
export interface SerieLinha { nome: string; pontos: Ponto[]; cor?: string; }

interface Props {
  series: SerieLinha[];
  altura?: number;
  unidade?: string;
  yMin?: number;
  yMax?: number;
  showLabels?: boolean;
}

export function LineChart({ series, altura = 200, unidade = '', yMin, yMax, showLabels = true }: Props) {
  const PAD = { top: 30, right: 34, bottom: 46, left: 52 };
  const W = 620;
  const innerW = W - PAD.left - PAD.right;
  const innerH = altura - PAD.top - PAD.bottom;

  const { xs, yMinC, yMaxC } = useMemo(() => {
    const xsSet = new Set<string>();
    let lo = Infinity, hi = -Infinity;
    series.forEach(s => s.pontos.forEach(p => {
      xsSet.add(p.x);
      if (p.y != null) { lo = Math.min(lo, p.y); hi = Math.max(hi, p.y); }
    }));
    const xs = Array.from(xsSet).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    if (!isFinite(lo)) { lo = 0; hi = 1; }
    const pad = (hi - lo) * 0.15 || 2;
    return { xs, yMinC: yMin ?? (lo - pad), yMaxC: yMax ?? (hi + pad) };
  }, [series, yMin, yMax]);

  if (!xs.length) return (
    <div style={{ padding: '24px 0', textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>
      Sem dados suficientes
    </div>
  );

  const xS = (x: string) =>
    xs.length === 1 ? innerW / 2 : (xs.indexOf(x) / (xs.length - 1)) * innerW;
  const yS = (y: number) =>
    innerH - ((y - yMinC) / (yMaxC - yMinC)) * innerH;

  const ticks = 4;
  const yTicks = Array.from({ length: ticks + 1 }, (_, i) =>
    yMinC + ((yMaxC - yMinC) * i) / ticks);
  const CORES = ['#10b981', '#60a5fa', '#f59e0b', '#a78bfa', '#f87171'];

  // ── Resolver colisões de labels ───────────────────────────────────────────
  // Para cada coluna X, ordena as séries por cy e distribui os labels
  // com offsets verticais suficientes para não sobreporem.
  const LABEL_H = 15; // altura reservada por label (px)
  const GAP     = 3;  // gap mínimo entre labels

  interface LabelPos { si: number; xi: number; cy: number; ly: number; label: string; cor: string; }
  const allLabels: LabelPos[] = [];

  series.forEach((s, si) => {
    const cor = s.cor ?? CORES[si % CORES.length];
    s.pontos.forEach(p => {
      if (p.y == null) return;
      const cx = xS(p.x);
      const cy = yS(p.y);
      const xi = xs.indexOf(p.x);
      allLabels.push({ si, xi, cy, ly: cy - 6, label: (Number.isInteger(p.y) ? p.y : p.y.toFixed(1)) + unidade, cor });
    });
  });

  // Agrupar por coluna xi e resolver colisões
  const byCol: Record<number, LabelPos[]> = {};
  allLabels.forEach(lb => { (byCol[lb.xi] ??= []).push(lb); });

  Object.values(byCol).forEach(col => {
    // Ordenar por posição ideal (cy), de cima para baixo no SVG (menor cy = mais alto)
    col.sort((a, b) => a.cy - b.cy);
    // Passagem top→bottom: empurrar para baixo se houver colisão
    for (let i = 1; i < col.length; i++) {
      const need = col[i - 1].ly + LABEL_H + GAP;
      if (col[i].ly < need) col[i].ly = need;
    }
    // Passagem bottom→top: se ultrapassou o limite inferior, empurrar para cima
    const maxLy = innerH + PAD.top - 4;
    for (let i = col.length - 1; i >= 0; i--) {
      if (col[i].ly > maxLy) col[i].ly = maxLy;
      if (i < col.length - 1) {
        const maxAllowed = col[i + 1].ly - LABEL_H - GAP;
        if (col[i].ly > maxAllowed) col[i].ly = maxAllowed;
      }
    }
    // Clamp: não subir acima do topo
    for (let i = 0; i < col.length; i++) {
      if (col[i].ly < LABEL_H) col[i].ly = LABEL_H;
      if (i > 0 && col[i].ly < col[i - 1].ly + LABEL_H + GAP) {
        col[i].ly = col[i - 1].ly + LABEL_H + GAP;
      }
    }
  });

  return (
    <div style={{ width: '100%' }}>
      <svg viewBox={`0 0 ${W} ${altura}`} style={{ width: '100%', display: 'block' }}>
        <defs>
          <filter id="chart-soft-shadow" x="-20%" y="-20%" width="140%" height="160%">
            <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#0f172a" floodOpacity=".10"/>
          </filter>
          {series.map((s, si) => {
            const cor = s.cor ?? CORES[si % CORES.length];
            const id = `area-${si}`;
            return (
              <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={cor} stopOpacity=".22"/>
                <stop offset="58%" stopColor={cor} stopOpacity=".07"/>
                <stop offset="100%" stopColor={cor} stopOpacity="0"/>
              </linearGradient>
            );
          })}
        </defs>
        <rect x="1" y="1" width={W - 2} height={altura - 2} rx="18" fill="#ffffff" opacity=".72"/>
        <g transform={`translate(${PAD.left},${PAD.top})`}>

          {/* Grade horizontal */}
          {yTicks.map((t, i) => (
            <g key={i}>
              <line x1={0} x2={innerW} y1={yS(t)} y2={yS(t)}
                stroke={i === 0 ? '#dbe4ec' : '#edf3f7'} strokeWidth={i === 0 ? 1.2 : 1}/>
              <text x={-8} y={yS(t)} dy="0.32em" textAnchor="end"
                fontSize="10" fontWeight="700" fill="#8aa0b8" fontFamily="Inter,system-ui">
                {Number.isInteger(t) ? t : t.toFixed(1)}
              </text>
            </g>
          ))}

          {/* Eixo X */}
          {xs.map((x) => (
            <g key={x}>
              <line x1={xS(x)} x2={xS(x)} y1={innerH} y2={innerH + 4}
                stroke="#e2e8f0" strokeWidth="1"/>
              <text x={xS(x)} y={innerH + 16} textAnchor="middle"
                fontSize="10" fontWeight="700" fill="#8aa0b8" fontFamily="Inter,system-ui">
                {fmtData(x)}
              </text>
            </g>
          ))}

          {/* Séries — só linhas e pontos, SEM área preenchida */}
          {series.map((s, si) => {
            const cor = s.cor ?? CORES[si % CORES.length];
            const pts = s.pontos.filter(p => p.y != null) as { x: string; y: number }[];
            if (!pts.length) return null;
            const linePath = pts.map((p, i) =>
              `${i === 0 ? 'M' : 'L'} ${xS(p.x)} ${yS(p.y)}`).join(' ');
            const areaPath = pts.length > 1
              ? `${linePath} L ${xS(pts[pts.length - 1].x)} ${innerH} L ${xS(pts[0].x)} ${innerH} Z`
              : '';
            return (
              <g key={s.nome}>
                {areaPath && <path d={areaPath} fill={`url(#area-${si})`}/>}
                <path d={linePath} stroke={cor} strokeWidth="3.2"
                  fill="none" strokeLinejoin="round" strokeLinecap="round" filter="url(#chart-soft-shadow)"/>
                <path d={linePath} stroke="#ffffff" strokeWidth="1"
                  fill="none" strokeLinejoin="round" strokeLinecap="round" opacity=".85"/>
                {pts.map((p, pi) => (
                  <circle key={p.x} cx={xS(p.x)} cy={yS(p.y)} r="3"
                    fill="#fff" stroke={cor} strokeWidth="2.5"/>
                ))}
              </g>
            );
          })}

          {/* Labels — posicionados sem colisão */}
          {showLabels && allLabels.map((lb, i) => (
            <text key={i}
              x={xS(xs[lb.xi])}
              y={lb.ly}
              textAnchor="middle"
              fontSize="11"
              fontWeight="700"
              fill={lb.cor}
              fontFamily="Inter,system-ui">
              {lb.label}
            </text>
          ))}

          {/* Borda inferior */}
          <line x1={0} x2={innerW} y1={innerH} y2={innerH}
            stroke="#dbe4ec" strokeWidth="1.2"/>
        </g>
      </svg>

      {/* Legenda */}
      {series.length > 1 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px',
          paddingLeft: PAD.left, marginTop: 6 }}>
          {series.map((s, i) => (
            <div key={s.nome} style={{ display: 'flex', alignItems: 'center', gap: 5,
              fontSize: 12, fontWeight: 700, color: '#475569', padding:'4px 9px',
              background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:999 }}>
              <div style={{ width: 18, height: 4, borderRadius: 999,
                background: s.cor ?? CORES[i % CORES.length], boxShadow:`0 4px 10px ${s.cor ?? CORES[i % CORES.length]}44` }}/>
              {s.nome}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function fmtData(iso: string) {
  const d = new Date(iso + 'T12:00:00Z');
  return `${String(d.getUTCDate()).padStart(2,'0')}/${String(d.getUTCMonth()+1).padStart(2,'0')}/${String(d.getUTCFullYear()).slice(-2)}`;
}
