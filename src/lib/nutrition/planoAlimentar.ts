export type SexoNutricional = 'M' | 'F';
export type FonteTmbPreferida = 'auto' | 'bioimpedancia' | 'antropometria' | 'mifflin_st_jeor';
export type FonteTmbCalculada = 'bioimpedancia' | 'antropometria' | 'mifflin_st_jeor' | 'indisponivel';

export interface DadosTmbPaciente {
  sexo?: SexoNutricional | null;
  idade?: number | null;
  pesoKg?: number | null;
  alturaCm?: number | null;
  tmbBioimpedancia?: number | null;
  tmbAntropometria?: number | null;
  tmbFontePreferida?: FonteTmbPreferida | null;
}

export interface ModeloPlanoAlimentar {
  fator_atividade?: number | null;
  ajuste_calorico_kcal?: number | null;
  proteina_g_kg?: number | null;
  gordura_pct?: number | null;
  agua_ml_kg?: number | null;
  fibras_g?: number | null;
  objetivo?: string | null;
}

export interface ResultadoPlanoAlimentar {
  tmbKcal: number | null;
  tmbOrigem: FonteTmbCalculada;
  vetKcal: number | null;
  proteinaG: number | null;
  carboidratoG: number | null;
  gorduraG: number | null;
  aguaMl: number | null;
  fibrasG: number | null;
  proteinaPct: number | null;
  carboidratoPct: number | null;
  gorduraPct: number | null;
}

function num(v: any): number | null {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function calcularMifflin(dados: DadosTmbPaciente): number | null {
  const peso = num(dados.pesoKg);
  const altura = num(dados.alturaCm);
  const idade = num(dados.idade);
  if (!peso || !altura || !idade || !dados.sexo) return null;

  const base = 10 * peso + 6.25 * altura - 5 * idade;
  const tmb = dados.sexo === 'M' ? base + 5 : base - 161;
  return Math.round(tmb);
}

export function listarFontesTmb(dados: DadosTmbPaciente) {
  const bio = num(dados.tmbBioimpedancia);
  const antro = num(dados.tmbAntropometria);
  const mifflin = calcularMifflin(dados);

  return [
    {
      id: 'bioimpedancia' as const,
      label: 'Bioimpedancia',
      valorKcal: bio && bio > 0 ? Math.round(bio) : null,
      disponivel: Boolean(bio && bio > 0),
    },
    {
      id: 'antropometria' as const,
      label: 'Antropometria / dobras',
      valorKcal: antro && antro > 0 ? Math.round(antro) : null,
      disponivel: Boolean(antro && antro > 0),
    },
    {
      id: 'mifflin_st_jeor' as const,
      label: 'Estimativa Mifflin-St Jeor',
      valorKcal: mifflin,
      disponivel: Boolean(mifflin),
    },
  ];
}

export function estimarTmb(dados: DadosTmbPaciente): Pick<ResultadoPlanoAlimentar, 'tmbKcal' | 'tmbOrigem'> {
  const fontes = listarFontesTmb(dados);
  const preferida = dados.tmbFontePreferida && dados.tmbFontePreferida !== 'auto' ? dados.tmbFontePreferida : null;

  if (preferida) {
    const fonte = fontes.find((f) => f.id === preferida);
    if (fonte?.disponivel && fonte.valorKcal) {
      return { tmbKcal: fonte.valorKcal, tmbOrigem: fonte.id };
    }
  }

  const fallback = fontes.find((f) => f.disponivel && f.valorKcal);
  if (!fallback?.valorKcal) return { tmbKcal: null, tmbOrigem: 'indisponivel' };
  return { tmbKcal: fallback.valorKcal, tmbOrigem: fallback.id };
}

export function calcularPlanoAlimentar(dados: DadosTmbPaciente, modelo: ModeloPlanoAlimentar = {}): ResultadoPlanoAlimentar {
  const { tmbKcal, tmbOrigem } = estimarTmb(dados);
  const peso = num(dados.pesoKg);
  const fator = num(modelo.fator_atividade) ?? 1.4;
  const ajuste = num(modelo.ajuste_calorico_kcal) ?? 0;
  const proteinaGKg = num(modelo.proteina_g_kg) ?? 1.6;
  const gorduraPct = num(modelo.gordura_pct) ?? 30;
  const aguaMlKg = num(modelo.agua_ml_kg) ?? 35;
  const fibrasG = num(modelo.fibras_g) ?? 25;

  if (!tmbKcal || !peso) {
    return {
      tmbKcal,
      tmbOrigem,
      vetKcal: null,
      proteinaG: null,
      carboidratoG: null,
      gorduraG: null,
      aguaMl: peso ? Math.round(peso * aguaMlKg) : null,
      fibrasG,
      proteinaPct: null,
      carboidratoPct: null,
      gorduraPct,
    };
  }

  const vetKcal = Math.max(800, Math.round(tmbKcal * fator + ajuste));
  const proteinaG = Math.round(peso * proteinaGKg);
  const proteinaKcal = proteinaG * 4;
  const gorduraG = Math.round((vetKcal * (gorduraPct / 100)) / 9);
  const gorduraKcal = gorduraG * 9;
  const carboKcal = Math.max(0, vetKcal - proteinaKcal - gorduraKcal);
  const carboidratoG = Math.round(carboKcal / 4);

  return {
    tmbKcal,
    tmbOrigem,
    vetKcal,
    proteinaG,
    carboidratoG,
    gorduraG,
    aguaMl: Math.round(peso * aguaMlKg),
    fibrasG,
    proteinaPct: Math.round((proteinaKcal / vetKcal) * 100),
    carboidratoPct: Math.round((carboKcal / vetKcal) * 100),
    gorduraPct: Math.round((gorduraKcal / vetKcal) * 100),
  };
}

export const referenciasNutricionais = [
  'Mifflin MD, St Jeor ST, Hill LA, Scott BJ, Daugherty SA, Koh YO. A new predictive equation for resting energy expenditure in healthy individuals. Am J Clin Nutr. 1990.',
  'Institute of Medicine. Dietary Reference Intakes for Energy, Carbohydrate, Fiber, Fat, Fatty Acids, Cholesterol, Protein, and Amino Acids. National Academies Press. 2005.',
  'Institute of Medicine. Dietary Reference Intakes for Water, Potassium, Sodium, Chloride, and Sulfate. National Academies Press. 2005.',
];
