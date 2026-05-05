'use client';

export async function upsertModulo(tabela: string, avaliacaoId: string, payload: Record<string, any>) {
  const res = await fetch('/api/modulos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tabela, avaliacaoId, payload }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error ?? 'Erro ao salvar modulo');
}

export async function upsertScores(avaliacaoId: string, payload: Record<string, any>) {
  const res = await fetch('/api/scores', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ avaliacaoId, payload }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error ?? 'Erro ao salvar scores');
}

export async function finalizarAvaliacao(avaliacaoId: string) {
  const res = await fetch(`/api/avaliacoes/${avaliacaoId}/finalizar`, {
    method: 'POST',
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error ?? 'Erro ao finalizar avaliacao');
}

export async function buscarModulo(tabela: string, avaliacaoId: string) {
  const params = new URLSearchParams({ tabela, avaliacaoId });
  const res = await fetch(`/api/modulos?${params.toString()}`, { cache: 'no-store' });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error ?? 'Erro ao buscar modulo');
  return body.data;
}
