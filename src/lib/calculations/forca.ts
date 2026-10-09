/** Força relativa (kgf/kg) */
export const forcaRelativa = (kgf: number, pesoKg: number) =>
  pesoKg > 0 ? +(kgf / pesoKg).toFixed(3) : 0;

/**
 * Assimetria (%) entre dominante e não dominante.
 * Acima de 10-15% é considerado clinicamente relevante.
 */
export function assimetria(dir: number, esq: number): number {
  const max = Math.max(dir, esq);
  const min = Math.min(dir, esq);
  if (max === 0) return 0;
  return +(((max - min) / max) * 100).toFixed(2);
}

export type PopulacaoRef = 'geral' | 'ativa' | 'atleta';
