/**
 * Estimativa do limite natural muscular e massa óssea ideal.
 *
 * Modelos usados:
 *   - FFMI (Fat-Free Mass Index) — Schutz et al. 2002
 *     FFMI = massa_magra / estatura^2
 *     Limite natural ~25 para homens, ~22 para mulheres (Kouri et al.)
 *
 *   - Berkhan/McDonald máximo de massa magra em função da estatura
 *     Homens: (estatura_cm - 100) kg de massa magra = limite genético
 *     Mulheres: (estatura_cm - 100) * 0.85 kg
 *
 *   - Massa óssea ideal (referência: Heyward & Stolarczyk)
 *     Homens: ~15% da massa magra
 *     Mulheres: ~12% da massa magra
 */

type Sexo = 'M' | 'F';

export interface LimiteNatural {
  ffmi: number;
  ffmiClassificacao: string;
  ffmiLimite: number;
  pctDoLimite: number;           // % do limite genético atingido
  massaMagraMaxEstimada: number; // kg (Berkhan)
  massaMagraAtual: number;
  potencialGanhoKg: number;      // quanto ainda pode ganhar
  massaOsseaIdeal: number;
  massaOsseaAtual: number | null;
  osseaStatus: string;
  resumo: string;
}

export function calcLimiteNatural(opts: {
  massaMagra: number;
  estaturaCm: number;
  sexo: Sexo;
  massaOssea?: number | null;
}): LimiteNatural {
  const { massaMagra, estaturaCm, sexo, massaOssea } = opts;
  const estaturaM = estaturaCm / 100;

  // FFMI
  const ffmi = +(massaMagra / (estaturaM * estaturaM)).toFixed(1);
  const ffmiLimite = sexo === 'M' ? 25.0 : 22.0;
  const ffmiClassificacao = classificarFFMI(ffmi, sexo);

  // Berkhan limit
  const massaMagraMax = sexo === 'M'
    ? estaturaCm - 100
    : (estaturaCm - 100) * 0.85;
  const pctDoLimite = +(massaMagra / massaMagraMax * 100).toFixed(1);
  const potencialGanho = Math.max(0, +(massaMagraMax - massaMagra).toFixed(1));

  // Massa óssea ideal
  const massaOsseaIdeal = +(massaMagra * (sexo === 'M' ? 0.15 : 0.12)).toFixed(1);
  let osseaStatus = 'Não avaliada';
  if (massaOssea != null) {
    const ratio = massaOssea / massaOsseaIdeal;
    if (ratio >= 0.95) osseaStatus = 'Adequada';
    else if (ratio >= 0.85) osseaStatus = 'Levemente abaixo';
    else osseaStatus = 'Abaixo do esperado — investigar';
  }

  // Resumo textual
  let resumo: string;
  if (pctDoLimite >= 95) {
    resumo = `Você está muito próximo do limite genético natural (${pctDoLimite}%). Ganhos adicionais serão mínimos e lentos. Foque em manutenção e qualidade.`;
  } else if (pctDoLimite >= 85) {
    resumo = `Você atingiu ${pctDoLimite}% do seu potencial genético. Ainda há margem de ~${potencialGanho} kg de massa magra, mas o progresso será mais lento. Periodização e nutrição precisas são essenciais.`;
  } else if (pctDoLimite >= 70) {
    resumo = `Você está em ${pctDoLimite}% do potencial genético. Há espaço significativo para ganho (~${potencialGanho} kg). Um programa bem estruturado com nutrição adequada pode acelerar o progresso.`;
  } else {
    resumo = `Você está em ${pctDoLimite}% do seu potencial. Há grande margem de desenvolvimento (~${potencialGanho} kg de massa magra possível). Fase ideal para ganhos rápidos com treino e alimentação corretos.`;
  }

  return {
    ffmi, ffmiClassificacao, ffmiLimite, pctDoLimite,
    massaMagraMaxEstimada: +massaMagraMax.toFixed(1),
    massaMagraAtual: massaMagra,
    potencialGanhoKg: potencialGanho,
    massaOsseaIdeal,
    massaOsseaAtual: massaOssea ?? null,
    osseaStatus,
    resumo,
  };
}

function classificarFFMI(ffmi: number, sexo: Sexo): string {
  if (sexo === 'M') {
    if (ffmi < 18) return 'Abaixo da média';
    if (ffmi < 20) return 'Média';
    if (ffmi < 22) return 'Acima da média';
    if (ffmi < 23) return 'Excelente';
    if (ffmi < 25) return 'Superior (próximo do limite natural)';
    if (ffmi < 26) return 'Limite natural — suspeita de uso de anabólicos se natural';
    return 'Acima do limite natural';
  }
  // Feminino
  if (ffmi < 14) return 'Abaixo da média';
  if (ffmi < 16) return 'Média';
  if (ffmi < 18) return 'Acima da média';
  if (ffmi < 20) return 'Excelente';
  if (ffmi < 22) return 'Superior (próximo do limite natural)';
  return 'Limite natural atingido';
}
