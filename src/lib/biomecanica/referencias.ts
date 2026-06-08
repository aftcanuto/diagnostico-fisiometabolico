type AnguloBiomecanica = {
  valor?: number | string | null;
  ideal_min?: number;
  ideal_max?: number;
  classificacao?: string;
  [key: string]: unknown;
};

const REFERENCIAS_ATUALIZADAS = {
  queda_pelve_esq: { min: 0, max: 2 },
  queda_pelve_dir: { min: 0, max: 2 },
} as const;

function classificarAngulo(valor: number, min: number, max: number) {
  if (valor >= min && valor <= max) return 'ideal';

  const margem = (max - min) * 0.2;
  if (valor >= min - margem && valor <= max + margem) return 'atencao';

  return 'fora';
}

export function normalizarReferenciasBiomecanica(angulos: unknown): Record<string, AnguloBiomecanica> {
  if (!angulos || typeof angulos !== 'object' || Array.isArray(angulos)) return {};

  const normalizados = { ...(angulos as Record<string, AnguloBiomecanica>) };

  for (const [chave, referencia] of Object.entries(REFERENCIAS_ATUALIZADAS)) {
    const angulo = normalizados[chave];
    if (!angulo || typeof angulo !== 'object') continue;

    const valor = Number(angulo.valor);
    normalizados[chave] = {
      ...angulo,
      ideal_min: referencia.min,
      ideal_max: referencia.max,
      ...(Number.isFinite(valor)
        ? { classificacao: classificarAngulo(valor, referencia.min, referencia.max) }
        : {}),
    };
  }

  return normalizados;
}
