export type SexoNutricional = 'M' | 'F';

export interface DadosTmbPaciente {
  sexo?: SexoNutricional | null;
  idade?: number | null;
  pesoKg?: number | null;
  alturaCm?: number | null;
  tmbBioimpedancia?: number | null;
  tmbAntropometria?: number | null;
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
  tmbOrigem: 'bioimpedancia' | 'antropometria' | 'mifflin_st_jeor' | 'indisponivel';
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

export function estimarTmb(dados: DadosTmbPaciente): Pick<ResultadoPlanoAlimentar, 'tmbKcal' | 'tmbOrigem'> {
  const bio = num(dados.tmbBioimpedancia);
  if (bio && bio > 0) return { tmbKcal: Math.round(bio), tmbOrigem: 'bioimpedancia' };

  const antro = num(dados.tmbAntropometria);
  if (antro && antro > 0) return { tmbKcal: Math.round(antro), tmbOrigem: 'antropometria' };

  const peso = num(dados.pesoKg);
  const altura = num(dados.alturaCm);
  const idade = num(dados.idade);
  if (!peso || !altura || !idade || !dados.sexo) return { tmbKcal: null, tmbOrigem: 'indisponivel' };

  const base = 10 * peso + 6.25 * altura - 5 * idade;
  const tmb = dados.sexo === 'M' ? base + 5 : base - 161;
  return { tmbKcal: Math.round(tmb), tmbOrigem: 'mifflin_st_jeor' };
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
