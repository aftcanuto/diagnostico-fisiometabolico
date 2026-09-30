type AnguloBiomecanica = {
  valor?: number | string | null;
  ideal_min?: number;
  ideal_max?: number;
  classificacao?: string;
  [key: string]: unknown;
};

export const REFERENCIAS_BIOMECANICA = {
  cabeca:                   { plano: 'Plano sagital', label: 'Alinhamento da cabeça', min: -8, max: 2 },
  tronco:                   { plano: 'Plano sagital', label: 'Posicionamento do tronco', min: 4, max: 10 },
  aterrissagem_passada:     { plano: 'Plano sagital', label: 'Aterrissagem (passada)', min: -10, max: 10 },
  joelho_frente_contato:    { plano: 'Plano sagital', label: 'Ângulo do joelho da frente ao bater o pé', min: 135, max: 180 },
  joelho_posterior_contato: { plano: 'Plano sagital', label: 'Ângulo posterior do joelho ao bater o pé', min: 0, max: 101 },
  bracos:                   { plano: 'Plano sagital', label: 'Posição dos braços', min: 75, max: 85 },
  queda_pelve_esq:          { plano: 'Plano posterior', label: 'Queda da pelve no pouso do pé esquerdo', min: 0, max: 2 },
  queda_pelve_dir:          { plano: 'Plano posterior', label: 'Queda da pelve no pouso do pé direito', min: 0, max: 2 },
  alinhamento_joelho_esq:   { plano: 'Plano posterior', label: 'Alinhamento do joelho da perna esquerda', min: -3, max: 3 },
  alinhamento_joelho_dir:   { plano: 'Plano posterior', label: 'Alinhamento do joelho da perna direita', min: -3, max: 3 },
  pronacao_supinacao_esq:   { plano: 'Plano posterior', label: 'Pronação/Supinação pé esquerdo', min: -5, max: 5 },
  pronacao_supinacao_dir:   { plano: 'Plano posterior', label: 'Pronação/Supinação pé direito', min: -5, max: 5 },
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

  for (const [chave, referencia] of Object.entries(REFERENCIAS_BIOMECANICA)) {
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
