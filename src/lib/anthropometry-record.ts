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
  const snapshot = row.resultados_v2 ?? {};
  const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
  const usable = (item: any) => finite(item?.value) && (item?.status === 'available' || item?.status === 'review');
  const cleanLimitation = (reason: unknown) => String(reason ?? '')
    .split(';')
    .map(part => part.trim())
    .filter(part => part && !/completar primeira e segunda leituras em rodadas/i.test(part))
    .join('; ');
  const resultForAI = (item: any) => ({
    id: item.id,
    label: item.label,
    value: item.value,
    unit: item.unit,
    classification: item.classification ?? null,
    methodId: item.methodId,
    referenceIds: item.referenceIds ?? [],
    quality: item.status === 'review' ? 'calculado_com_ressalva' : 'calculado',
    limitation: item.status === 'review' ? cleanLimitation(item.reason) || 'Coleta parcial; interpretar com cautela.' : null,
  });
  const measurements = Object.values(snapshot.measurements ?? {})
    .filter((item: any) => finite(item?.value))
    .map((item: any) => ({
      id: item.id,
      label: item.label,
      value: item.value,
      unit: item.unit,
      side: item.side,
      readingsCount: item.count,
      consolidation: item.consolidation,
      quality: item.status === 'review' ? 'calculada_com_ressalva' : 'consolidada',
    }));
  const results = (snapshot.results ?? []).filter((item: any) => item.selected && usable(item)).map(resultForAI);
  const phantom = (snapshot.phantom ?? []).filter((item: any) => item.selected && usable(item)).map(resultForAI);
  const referenceIds = new Set([...results, ...phantom].flatMap((item: any) => item.referenceIds));
  return {
    formato: 'Antropometria V2', revision: row.revision_v2,
    resultados: {
      version: snapshot.version,
      calculatedAt: snapshot.calculatedAt,
      context: snapshot.context,
      age: snapshot.age,
      collection: snapshot.collection,
      measurements,
      results,
      phantom,
      somatotype: snapshot.somatotype,
      references: (snapshot.references ?? []).filter((reference: any) => referenceIds.has(reference.id)),
    },
    observacao: 'Analise os resultados numericos calculados. Coleta unica ou parcial reduz a robustez metrologica, mas nao invalida automaticamente o valor: interprete com cautela e mencione a limitacao uma unica vez, sem transformar a analise em lista de pendencias.',
  };
}
