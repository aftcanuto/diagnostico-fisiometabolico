/**
 * Classificação do teste de flexibilidade (Banco de Wells / Sit and Reach)
 * Referência: ACSM Guidelines for Exercise Testing and Prescription (11th ed.)
 * Adaptado para faixas etárias por sexo.
 */

type Sexo = 'M' | 'F';

interface ClassificacaoWells {
  classificacao: string;
  percentil: string;
}

// Tabelas ACSM para Sit and Reach (cm) — masculino por faixa etária
const TABELA_M: Record<string, { excelente: number; bom: number; medio: number; regular: number }> = {
  '20-29': { excelente: 40, bom: 34, medio: 30, regular: 25 },
  '30-39': { excelente: 38, bom: 33, medio: 28, regular: 23 },
  '40-49': { excelente: 35, bom: 29, medio: 24, regular: 18 },
  '50-59': { excelente: 35, bom: 28, medio: 24, regular: 16 },
  '60+':   { excelente: 33, bom: 25, medio: 20, regular: 15 },
};

const TABELA_F: Record<string, { excelente: number; bom: number; medio: number; regular: number }> = {
  '20-29': { excelente: 41, bom: 37, medio: 33, regular: 28 },
  '30-39': { excelente: 41, bom: 36, medio: 32, regular: 27 },
  '40-49': { excelente: 38, bom: 34, medio: 30, regular: 25 },
  '50-59': { excelente: 39, bom: 33, medio: 30, regular: 25 },
  '60+':   { excelente: 35, bom: 31, medio: 27, regular: 23 },
};

function faixaEtaria(idade: number): string {
  if (idade < 30) return '20-29';
  if (idade < 40) return '30-39';
  if (idade < 50) return '40-49';
  if (idade < 60) return '50-59';
  return '60+';
}

export function classificarWells(cm: number, sexo: Sexo, idade: number): ClassificacaoWells {
  const faixa = faixaEtaria(idade);
  const tab = sexo === 'M' ? TABELA_M[faixa] : TABELA_F[faixa];

  if (cm >= tab.excelente) return { classificacao: 'Excelente', percentil: '≥ P90' };
  if (cm >= tab.bom)       return { classificacao: 'Bom', percentil: 'P70-P89' };
  if (cm >= tab.medio)     return { classificacao: 'Médio', percentil: 'P50-P69' };
  if (cm >= tab.regular)   return { classificacao: 'Regular', percentil: 'P30-P49' };
  return { classificacao: 'Fraco', percentil: '< P30' };
}

export function scoreFlexibilidade(cm: number | null, sexo: Sexo, idade: number): number | null {
  if (cm == null) return null;
  const faixa = faixaEtaria(idade);
  const tab = sexo === 'M' ? TABELA_M[faixa] : TABELA_F[faixa];
  const muitoFraco = tab.regular - 10;
  const interp = (valor: number, min: number, max: number, outMin: number, outMax: number) => {
    if (max === min) return outMin;
    const pct = (valor - min) / (max - min);
    return Math.round(outMin + pct * (outMax - outMin));
  };

  if (cm >= tab.excelente) return Math.min(100, interp(cm, tab.excelente, tab.excelente + 8, 90, 100));
  if (cm >= tab.bom) return interp(cm, tab.bom, tab.excelente, 75, 89);
  if (cm >= tab.medio) return interp(cm, tab.medio, tab.bom, 60, 74);
  if (cm >= tab.regular) return interp(cm, tab.regular, tab.medio, 45, 59);
  if (cm >= muitoFraco) return interp(cm, muitoFraco, tab.regular, 25, 44);
  return 20;
}
