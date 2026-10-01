import { JUMP_PROTOCOLS, jumpSchema, jumpSummary, jumpReference, jumpComparable } from '@/lib/jump-test';

export const jumpFormat = (n: number | null | undefined, digits = 2) => n == null ? '-' : n.toLocaleString('pt-BR', { maximumFractionDigits: digits });

export function JumpTestSummary({ data, previous, previousDate }: { data: unknown; previous?: unknown; previousDate?: string }) {
  const parsed = jumpSchema.safeParse(data);
  if (!parsed.success) return null;
  const d = parsed.data, s = jumpSummary(d), ref = jumpReference(d);
  const old = jumpSchema.safeParse(previous), before = old.success ? jumpSummary(old.data) : null;
  return <section aria-label="Resultados Jump Test" className="space-y-3 py-4" style={{ minWidth: 0 }}>
    <h3 className="text-lg font-semibold">Jump Test</h3>
    <p className="text-sm">{d.equipamento} · {d.peso_kg ? `${jumpFormat(d.peso_kg)} kg` : 'Peso nao informado'} · DJ {d.altura_queda_cm} cm · Repetidos {d.duracao_s} s</p>
    {!s.pronto && <p role="status" className="text-sm text-amber-800">Resultados parciais: {s.pendencias.join(' ')}</p>}
    <div className="hidden md:block overflow-x-auto"><table className="w-full text-sm" style={{ borderCollapse: 'collapse', minWidth: 480 }}>
      <thead><tr>{['Protocolo', 'Validos', 'Media (cm)', 'Melhor (cm)', 'CV (%)', 'Pico medio (W)', 'RSI (m/s)'].map(h => <th key={h} className="border-b p-2 text-left">{h}</th>)}</tr></thead>
      <tbody>{s.grupos.map(g => <tr key={g.protocolo}>{[JUMP_PROTOCOLS[g.protocolo], `${g.n}${g.completo ? '' : ' *'}`, jumpFormat(g.media_cm), jumpFormat(g.melhor_cm), jumpFormat(g.cv_percent), jumpFormat(g.potencia_media_w), jumpFormat(g.rsi_medio)].map((v, i) => <td key={i} className="border-b p-2">{v}</td>)}</tr>)}</tbody>
    </table></div>
    <div className="md:hidden" style={{ borderTop: '1px solid #e2e8f0' }}>
      {s.grupos.map(g => (
        <div key={g.protocolo} style={{ padding: '12px 0', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, marginBottom: 8 }}>
            <strong style={{ fontSize: 13, lineHeight: 1.35 }}>{JUMP_PROTOCOLS[g.protocolo]}</strong>
            <span style={{ flexShrink: 0, fontSize: 12, color: '#64748b' }}>{g.n}{g.completo ? '' : ' *'} validos</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: '8px 12px' }}>
            {[
              ['Media', `${jumpFormat(g.media_cm)} cm`],
              ['Melhor', `${jumpFormat(g.melhor_cm)} cm`],
              ['CV', `${jumpFormat(g.cv_percent)}%`],
              ['Pico medio', `${jumpFormat(g.potencia_media_w)} W`],
              ['RSI', `${jumpFormat(g.rsi_medio)} m/s`],
            ].map(([label, value]) => (
              <div key={label} style={{ minWidth: 0 }}>
                <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase' }}>{label}</div>
                <div style={{ fontSize: 13, fontWeight: 600, overflowWrap: 'anywhere' }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
    <p className="text-sm">EUR altura: {jumpFormat(s.eur_altura)} · EUR potencia: {jumpFormat(s.eur_potencia)} · Assimetria de altura: {jumpFormat(s.assimetria_altura_percent)}% · Maior media: {s.lado_maior_altura ?? '-'}</p>
    <p className="text-xs text-gray-600">EUR: CMJ/SJ, medias de 3 validas. Assimetria: |D-E|/maior(D,E) x 100, CMJ unilateral. Sem classificacao de lesao. Potencia preservada do equipamento.</p>
    {ref && <p className="text-sm"><a className="underline" href={ref.url} target="_blank" rel="noreferrer">{ref.fonte}</a>: {ref.label}, n={ref.n}, CMJ {ref.media_cm} ± {ref.dp_cm} cm (media ± DP). {ref.protocolo}. {ref.limitacao}</p>}
    {old.success && before && <div className="text-sm"><h4 className="font-semibold">Comparacao com {previousDate ?? 'avaliacao anterior'}</h4>{s.grupos.map(g => {
      const b = before.grupos.find(x => x.protocolo === g.protocolo);
      const comparable = jumpComparable(d, old.data, g.protocolo) && s.pronto && before.pronto && g.completo && b?.completo;
      return <p key={g.protocolo}>{JUMP_PROTOCOLS[g.protocolo]}: {comparable && g.media_cm != null && b?.media_cm != null ? `${jumpFormat(b.media_cm)} → ${jumpFormat(g.media_cm)} cm (diferenca ${jumpFormat(g.media_cm - b.media_cm)} cm)` : 'sem comparacao direta: protocolo diferente ou dados incompletos'}.</p>;
    })}<p className="text-xs text-gray-600">Variacao observada, sem inferir fadiga ou mudanca clinicamente significativa.</p></div>}
    {d.conclusao && <p className="whitespace-pre-wrap text-sm">{d.conclusao}</p>}
  </section>;
}
