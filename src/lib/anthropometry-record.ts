/** V2 rows are never inferred from legacy anatomical keys. */
export function isAnthropometryV2(row: any): boolean {
  return row?.registro_v2?.version === 2;
}

const LEGACY_DATA_FIELDS = [
  'peso', 'estatura', 'dobras', 'circunferencias', 'diametros',
  'percentual_gordura', 'massa_magra', 'massa_ossea', 'imc',
  'somatotipo', 'rcq', 'ffmi',
] as const;

function hasValue(value: unknown): boolean {
  if (value == null) return false;
  if (typeof value === 'string') return value.trim() !== '';
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value === 'boolean') return value;
  if (Array.isArray(value)) return value.some(hasValue);
  if (typeof value === 'object') return Object.values(value).some(hasValue);
  return false;
}

/** Keeps real historical collections in the legacy UI, but ignores empty autosave shells. */
export function hasLegacyAnthropometryData(row: any): boolean {
  if (!row || isAnthropometryV2(row)) return false;
  return LEGACY_DATA_FIELDS.some(field => hasValue(row[field]));
}

export function anthropometryAnalysisUsable(analysis: any, row: any): boolean {
  if (!isAnthropometryV2(row) || !['antropometria', 'conclusao_global', 'evolucao'].includes(analysis?.tipo)) return true;
  return analysis?.conteudo?._anthropometry_revision === row.revision_v2;
}

export function anthropometryAIData(row: any) {
  if (!isAnthropometryV2(row)) return row;
  return {
    formato: 'Antropometria V2', revision: row.revision_v2,
    resultados: { ...row.resultados_v2,
      results: (row.resultados_v2?.results ?? []).filter((r: any) => r.selected).map((r: any) =>
        r.status === 'available' ? r : { ...r, value: null }),
      phantom: (row.resultados_v2?.phantom ?? []).map((r: any) => r.status === 'available' ? r : { ...r, value: null }),
    },
    observacao: 'Usar somente resultados disponiveis e metodos selecionados, sem calcular numeros novos ou misturar compartimentos. Estados de revisao nao sao resultados clinicos confirmados.',
  };
}
