/** V2 rows are never inferred from legacy anatomical keys. */
export function isAnthropometryV2(row: any): boolean {
  return row?.registro_v2?.version === 2;
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
