'use client';
export interface BarrasItem { label: string; valor: number; cor?: string; }

interface Props {
  items: BarrasItem[];
  titulo?: string;
  unidade?: string;
  horizontal?: boolean;
  altura?: number;
}

/**
 * Gráfico de barras simples em SVG puro.
 * `horizontal=true` é útil para listas longas (ex: circunferências).
 */
export function BarChart({ items, titulo, unidade = '', horizontal = false, altura }: Props) {
  if (!items.length) {
    return (
      <div className="py-8 text-center">
        {titulo && <div className="text-sm font-semibold text-slate-700 mb-1">{titulo}</div>}
        <div className="text-xs text-slate-400">Sem dados</div>
      </div>
    );
  }

  const max = Math.max(...items.map(i => i.valor), 1);
  const cor = (i: number, c?: string) => c ?? ['#1854ed', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][i % 5];

  if (horizontal) {
    const h = altura ?? items.length * 32 + 20;
    return (
      <div className="w-full">
        {titulo && <div className="text-sm font-semibold text-slate-700 mb-2">{titulo}</div>}
        <svg viewBox={`0 0 640 ${h}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
          {items.map((it, i) => {
            const y = i * 28 + 10;
            const larguraBar = (it.valor / max) * 430;
            return (
              <g key={it.label}>
                <text x={140} y={y + 14} textAnchor="end" fontSize="11" fill="#475569">{it.label}</text>
                <rect x={150} y={y + 4} width={larguraBar} height={18} rx={4} fill={cor(i, it.cor)} />
                <text x={150 + larguraBar + 6} y={y + 17} fontSize="11" fill="#334155" fontWeight={600}>
                  {it.valor}{unidade}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  }

  // Vertical
  const h = altura ?? 220;
  const innerH = h - 50;
  const W = 640;
  const larguraCol = Math.min(60, (W - 40) / items.length - 10);
  const step = (W - 40) / items.length;

  return (
    <div className="w-full">
      {titulo && <div className="text-sm font-semibold text-slate-700 mb-2">{titulo}</div>}
      <svg viewBox={`0 0 ${W} ${h}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
        <line x1={30} x2={W - 10} y1={innerH + 10} y2={innerH + 10} stroke="#cbd5e1" />
        {items.map((it, i) => {
          const x = 30 + i * step + (step - larguraCol) / 2;
          const altBar = (it.valor / max) * innerH;
          return (
            <g key={it.label}>
              <rect x={x} y={innerH + 10 - altBar} width={larguraCol} height={altBar} rx={4} fill={cor(i, it.cor)} />
              <text x={x + larguraCol / 2} y={innerH + 10 - altBar - 4} textAnchor="middle" fontSize="10" fill="#334155" fontWeight={600}>
                {it.valor}{unidade}
              </text>
              <text x={x + larguraCol / 2} y={innerH + 28} textAnchor="middle" fontSize="10" fill="#64748b">
                {it.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
