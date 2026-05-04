'use client';
import { createClient } from './supabase/client';

export async function upsertModulo(tabela: string, avaliacaoId: string, payload: Record<string, any>) {
  const supabase = createClient();
  const { error } = await supabase
    .from(tabela)
    .upsert({ avaliacao_id: avaliacaoId, ...payload }, { onConflict: 'avaliacao_id' });
  if (error) throw error;
}

export async function buscarModulo(tabela: string, avaliacaoId: string) {
  const supabase = createClient();
  const { data } = await supabase.from(tabela)
    .select('*').eq('avaliacao_id', avaliacaoId).maybeSingle();
  return data;
}
