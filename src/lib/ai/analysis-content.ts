const TEXT_FIELDS = [
  'resumo_clinico',
  'relatorio_global',
  'resumo_executivo',
  'interpretacao',
  'encaminhamento',
  'limitacoes',
  'versao_paciente',
  'mensagem_paciente',
];

const LIST_FIELDS = [
  'achados',
  'principais_achados',
  'pontos_fortes',
  'pontos_criticos',
  'riscos',
  'riscos_atencoes',
  'beneficios',
  'recomendacoes',
  'recomendacoes_praticas',
  'alertas',
  'tendencias',
  'progressos',
  'regressoes',
  'proximos_passos',
];

function hasText(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length >= 12;
}

export function hasUsableAnalysisContent(value: unknown): boolean {
  if (hasText(value)) return true;
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;

  const content = value as Record<string, unknown>;
  if (TEXT_FIELDS.some(field => hasText(content[field]))) return true;
  if (LIST_FIELDS.some(field => Array.isArray(content[field]) && content[field].some(hasText))) return true;

  return Array.isArray(content.prioridades) && content.prioridades.some(item => {
    if (!item || typeof item !== 'object') return false;
    const priority = item as Record<string, unknown>;
    return hasText(priority.titulo) || hasText(priority.acao);
  });
}

export function hasCompleteModuleAnalysisContent(value: unknown): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const content = value as Record<string, unknown>;
  return hasText(content.interpretacao) &&
    Array.isArray(content.achados) && content.achados.some(hasText) &&
    Array.isArray(content.recomendacoes) && content.recomendacoes.some(hasText) &&
    hasText(content.versao_paciente);
}

