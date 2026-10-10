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
  return textoPreenchido(content.relatorio_global, 1000)
    && content.relatorio_global.trim().length <= 7000
    && isGlobalConclusionSupportComplete(content);
}

export function isGlobalConclusionSupportComplete(value: unknown): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const content = value as GlobalConclusionContent;
  return textoPreenchido(content.resumo_executivo, 40)
    && Array.isArray(content.pontos_fortes)
    && Array.isArray(content.pontos_criticos)
    && Array.isArray(content.prioridades)
    && textoPreenchido(content.mensagem_paciente);
}

export function globalConclusionDiagnostics(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { tipo: typeof value, chaves: [] as string[] };
  }
  const content = value as GlobalConclusionContent;
  return {
    chaves: Object.keys(content).sort(),
    tamanho_relatorio: typeof content.relatorio_global === 'string' ? content.relatorio_global.trim().length : 0,
    tamanho_resumo: typeof content.resumo_executivo === 'string' ? content.resumo_executivo.trim().length : 0,
    pontos_fortes: Array.isArray(content.pontos_fortes) ? content.pontos_fortes.length : null,
    pontos_criticos: Array.isArray(content.pontos_criticos) ? content.pontos_criticos.length : null,
    prioridades: Array.isArray(content.prioridades) ? content.prioridades.length : null,
    tamanho_mensagem: typeof content.mensagem_paciente === 'string' ? content.mensagem_paciente.trim().length : 0,
  };
}

export function hasUsableGlobalConclusion(row: any): boolean {
  return textoPreenchido(row?.texto_editado, 40)
    || isGlobalConclusionComplete(row?.conteudo);
}
