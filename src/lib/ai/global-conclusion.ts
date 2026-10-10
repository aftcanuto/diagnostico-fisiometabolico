export interface GlobalConclusionContent {
  relatorio_global?: unknown;
  resumo_executivo?: unknown;
  pontos_fortes?: unknown;
  pontos_criticos?: unknown;
  prioridades?: unknown;
  mensagem_paciente?: unknown;
}

function textoPreenchido(value: unknown, minLength = 1): value is string {
  return typeof value === 'string' && value.trim().length >= minLength;
}

export function isGlobalConclusionComplete(value: unknown): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const content = value as GlobalConclusionContent;
  return textoPreenchido(content.relatorio_global, 200)
    && textoPreenchido(content.resumo_executivo, 40)
    && Array.isArray(content.pontos_fortes)
    && Array.isArray(content.pontos_criticos)
    && Array.isArray(content.prioridades)
    && textoPreenchido(content.mensagem_paciente);
}

export function hasUsableGlobalConclusion(row: any): boolean {
  return textoPreenchido(row?.texto_editado, 40)
    || isGlobalConclusionComplete(row?.conteudo);
}
