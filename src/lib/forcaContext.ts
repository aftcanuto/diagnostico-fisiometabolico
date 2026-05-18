export const FORCA_ESPORTES_OPCOES = [
  ['saude_geral', 'Saude geral'],
  ['corrida', 'Corrida'],
  ['musculacao', 'Musculacao'],
  ['beach_tennis', 'Beach tennis'],
  ['tenis', 'Tenis'],
  ['tenis_mesa', 'Tenis de mesa'],
  ['volei', 'Volei'],
  ['natacao', 'Natacao'],
  ['lutas', 'Lutas'],
  ['futebol', 'Futebol'],
  ['ciclismo', 'Ciclismo'],
  ['outro', 'Outro'],
] as const;

export const FORCA_FINALIDADES_OPCOES = [
  ['triagem', 'Triagem funcional'],
  ['performance', 'Performance'],
  ['retorno_esporte', 'Retorno ao esporte'],
  ['prevencao', 'Prevencao de lesoes'],
  ['dor', 'Dor / limitacao funcional'],
  ['reabilitacao', 'Reabilitacao'],
  ['hipertrofia', 'Hipertrofia'],
  ['emagrecimento', 'Emagrecimento'],
] as const;

export const FORCA_LADOS_DOMINANTES_OPCOES = [
  ['direito', 'Direito'],
  ['esquerdo', 'Esquerdo'],
  ['ambidestro', 'Ambidestro'],
] as const;

const esporteLabels = Object.fromEntries(FORCA_ESPORTES_OPCOES) as Record<string, string>;
const finalidadeLabels = Object.fromEntries(FORCA_FINALIDADES_OPCOES) as Record<string, string>;
const ladoLabels = Object.fromEntries(FORCA_LADOS_DOMINANTES_OPCOES) as Record<string, string>;

function labelFromMap(map: Record<string, string>, value?: string | null) {
  if (!value) return '';
  return map[value] ?? value;
}

export function labelEsporteForca(value?: string | null) {
  return labelFromMap(esporteLabels, value);
}

export function labelFinalidadeForca(value?: string | null) {
  return labelFromMap(finalidadeLabels, value);
}

export function labelLadoDominante(value?: string | null) {
  return labelFromMap(ladoLabels, value);
}
