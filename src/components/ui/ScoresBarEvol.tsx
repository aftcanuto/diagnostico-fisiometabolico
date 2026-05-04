'use client';

interface Ponto { x: string; y: number | null; }
interface Serie { nome: string; pontos: Ponto[]; cor: string; }

interface Props {
  series: Serie[];
  altura?: number;
}

function zCor(v: number | null) {
  if (v == null) return '#e2e8f0';
  if (v <= 40)  return '#ef4444';
  if (v <= 70)  return '#f59e0b';
  return '#10b981';
}

export function ScoresBarEvol({ series, altura = 280 }: Props) {
  if (!series.length) return null;

  // Coletar todas as datas únicas ordenadas
  const datas = Array.from(new Set(series.flatMap(s => s.pontos.map(p => p.x))))
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  if (!datas.length) return null;

  const W = 640;
  const PAD = { top: 36, right: 20, bottom: 56, left: 40 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = altura - PAD.top - PAD.bottom;

  const nDatas = datas.length;
  const nSeries = series.length;
  const grupoW = innerW / nDatas;
  const barW = Math.min(28, (grupoW - 16) / nSeries);
  const barGap = 3;
  const totalBarW = nSeries * barW + (nSeries - 1) * barGap;

  function fmtData(iso: string) {
    const d = new Date(iso);
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getFullYear()).slice(-2)}`;
  }

  function yS(v: number) {
    return innerH - (v / 100) * innerH;
  }

  // Grades horizontais
  const grades = [0, 25, 50, 75, 100];

  return (
    <div style={{ width: '100%' }}>
      <svg viewBox={`0 0 ${W} ${altura}`} style={{ width: '100%', display: 'block' }}
        xmlns="http://www.w3.org/2000/svg">
        <g transform={`translate(${PAD.left},${PAD.top})`}>

          {/* Grade */}
          {grades.map(g => (
            <g key={g}>
              <line x1={0} x2={innerW} y1={yS(g)} y2={yS(g)}
                stroke="#f1f5f9" strokeWidth="1"/>
              <text x={-6} y={yS(g)} dy="0.35em" textAnchor="end"
                fontSize="11" fill="#475569" fontFamily="Inter,system-ui">{g}</text>
            </g>
          ))}

          {/* Barras por data */}
          {datas.map((data, di) => {
            const gx = di * grupoW + grupoW / 2 - totalBarW / 2;
            return (
              <g key={data}>
                {series.map((s, si) => {
                  const pt = s.pontos.find(p => p.x === data);
                  const val = pt?.y ?? null;
                  if (val == null) return null;

                  const bx = gx + si * (barW + barGap);
                  const bh = (val / 100) * innerH;
                  const by = innerH - bh;
                  const cor = s.cor;

                  return (
                    <g key={s.nome}>
                      {/* Barra com gradiente */}
                      <defs>
                        <linearGradient id={`bg${di}${si}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={cor} stopOpacity="1"/>
                          <stop offset="100%" stopColor={cor} stopOpacity="0.6"/>
                        </linearGradient>
                      </defs>
                      <rect x={bx} y={by} width={barW} height={bh}
                        rx="4" fill={`url(#bg${di}${si})`}/>
                      {/* Valor acima */}
                      <text x={bx + barW/2} y={by - 5}
                        textAnchor="middle" fontSize="11" fontWeight="700"
                        fill={cor} fontFamily="Inter,system-ui">{val}</text>
                    </g>
                  );
                })}
                {/* Data no eixo X */}
                <text x={di * grupoW + grupoW / 2} y={innerH + 20}
                  textAnchor="middle" fontSize="11" fill="#475569"
                  fontFamily="Inter,system-ui">{fmtData(data)}</text>
              </g>
            );
          })}

          {/* Linha base */}
          <line x1={0} x2={innerW} y1={innerH} y2={innerH}
            stroke="#e2e8f0" strokeWidth="1.5"/>
        </g>
      </svg>

      {/* Legenda */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 20px',
        paddingLeft: PAD.left, marginTop: 6 }}>
        {series.map(s => (
          <div key={s.nome} style={{ display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 12, color: '#475569', fontWeight: 500 }}>
            <div style={{ width: 14, height: 14, borderRadius: 3,
              background: s.cor, flexShrink: 0 }}/>
            {s.nome}
          </div>
        ))}
      </div>
    </div>
  );
}
