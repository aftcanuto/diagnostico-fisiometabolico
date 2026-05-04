'use client';

interface Zona { label: string; nome: string; min: number; max: number; cor: string; }

export function ZonasChart({ zonas }: { zonas: Zona[] }) {
  if (!zonas.length) return null;

  const W = 720;
  const H = 270;
  const PAD = { top: 34, right: 26, bottom: 72, left: 42 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const maxVal = Math.max(...zonas.map(z => z.max), 1);
  const minVal = Math.min(...zonas.map(z => z.min || z.max), maxVal);
  const span = Math.max(1, maxVal - minVal);
  const barW = Math.min(74, innerW / zonas.length - 26);
  const gap = zonas.length > 1 ? (innerW - zonas.length * barW) / (zonas.length - 1) : 0;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id="zonaPanel" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff"/>
          <stop offset="100%" stopColor="#f8fafc"/>
        </linearGradient>
        <filter id="zonaShadow" x="-30%" y="-30%" width="160%" height="170%">
          <feDropShadow dx="0" dy="10" stdDeviation="10" floodColor="#0f172a" floodOpacity=".14"/>
        </filter>
      </defs>

      <rect x="10" y="10" width={W - 20} height={H - 20} rx="18" fill="url(#zonaPanel)" stroke="#e2e8f0"/>
      {[0.25, 0.5, 0.75, 1].map((p) => (
        <g key={p}>
          <line
            x1={PAD.left}
            x2={W - PAD.right}
            y1={PAD.top + innerH * (1 - p)}
            y2={PAD.top + innerH * (1 - p)}
            stroke="#e2e8f0"
            strokeDasharray="4 7"
          />
          <text
            x={PAD.left - 10}
            y={PAD.top + innerH * (1 - p) + 4}
            textAnchor="end"
            fontSize="10"
            fontWeight="700"
            fill="#94a3b8"
            fontFamily="Inter,system-ui"
          >
            {Math.round(minVal + span * p)}
          </text>
        </g>
      ))}

      {zonas.map((z, i) => {
        const x = PAD.left + i * (barW + gap);
        const yMax = PAD.top + innerH - (((z.max - minVal) / span) * innerH);
        const yMin = PAD.top + innerH - ((((z.min || minVal) - minVal) / span) * innerH);
        const h = Math.max(12, yMin - yMax);
        const y = yMax;
        const range = z.min > 0 ? `${z.min}-${z.max}` : `até ${z.max}`;

        return (
          <g key={z.label}>
            <defs>
              <linearGradient id={`zonaBar${i}`} x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor={z.cor} stopOpacity=".95"/>
                <stop offset="100%" stopColor={z.cor} stopOpacity=".58"/>
              </linearGradient>
            </defs>
            <rect x={x} y={PAD.top} width={barW} height={innerH} rx="15" fill="#f1f5f9"/>
            <rect x={x} y={y} width={barW} height={h} rx="15" fill={`url(#zonaBar${i})`} filter="url(#zonaShadow)"/>
            <rect x={x + 8} y={y + 8} width={barW - 16} height={Math.max(8, h * 0.35)} rx="10" fill="#fff" opacity=".2"/>
            <text x={x + barW / 2} y={y - 12} textAnchor="middle" fontSize="13" fontWeight="900" fill={z.cor} fontFamily="Inter,system-ui">
              {range} bpm
            </text>
            <text x={x + barW / 2} y={PAD.top + innerH + 26} textAnchor="middle" fontSize="14" fontWeight="900" fill="#0f172a" fontFamily="Inter,system-ui">
              {z.label}
            </text>
            <text x={x + barW / 2} y={PAD.top + innerH + 45} textAnchor="middle" fontSize="11" fontWeight="700" fill="#64748b" fontFamily="Inter,system-ui">
              {z.nome}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
