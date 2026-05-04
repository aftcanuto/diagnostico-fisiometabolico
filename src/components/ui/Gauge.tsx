import { scoreColor, scoreLabel } from '@/lib/scores';

interface Props {
  value: number | null;
  label: string;
  size?: number;
}

/**
 * Gauge circular — mesmo padrão visual do PatientDashboard.
 * Arco de fundo cinza + arco colorido proporcional ao score.
 */
export function Gauge({ value, label, size = 120 }: Props) {
  const v    = Math.max(0, Math.min(100, value ?? 0));
  const color = scoreColor(value);
  const cor   = color === 'bad' ? '#ef4444' : color === 'mid' ? '#f59e0b' : '#10b981';
  const lbl   = scoreLabel(value);

  // círculo: r=40, circunferência ≈ 251.3
  // exibimos 270° do arco (do -225° ao +45°, no topo)
  const R    = 40;
  const CIRC = 2 * Math.PI * R;          // 251.3
  const ARC  = (270 / 360) * CIRC;       // 188.5 — comprimento total do trilho
  const fill = (v / 100) * ARC;

  // rotacionar para que 0% fique em baixo-esquerda e 100% em baixo-direita
  const rotation = 135; // graus de rotação do SVG circle

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <svg width={size} height={size} viewBox="0 0 100 100">
        {/* trilho cinza */}
        <circle
          cx="50" cy="50" r={R}
          fill="none" stroke="#e2e8f0" strokeWidth="10"
          strokeDasharray={`${ARC} ${CIRC - ARC}`}
          strokeDashoffset="0"
          strokeLinecap="round"
          transform={`rotate(${rotation} 50 50)`}
        />
        {/* arco colorido */}
        <circle
          cx="50" cy="50" r={R}
          fill="none" stroke={cor} strokeWidth="10"
          strokeDasharray={`${fill} ${CIRC - fill}`}
          strokeDashoffset="0"
          strokeLinecap="round"
          transform={`rotate(${rotation} 50 50)`}
        />
        {/* valor */}
        <text x="50" y="55" textAnchor="middle"
          fontSize="20" fontWeight="800" fill={cor} fontFamily="Inter, system-ui">
          {value == null ? '—' : value}
        </text>
      </svg>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', textAlign: 'center' }}>{label}</div>
      <div style={{ fontSize: 11, fontWeight: 600, color: cor }}>{lbl}</div>
    </div>
  );
}

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}
