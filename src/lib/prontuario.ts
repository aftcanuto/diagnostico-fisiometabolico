type SupabaseAdmin = any;

const LABELS_MODULOS: Record<string, string> = {
  anamnese: 'Anamnese',
  sinais_vitais: 'Sinais vitais',
  posturografia: 'Posturografia',
  bioimpedancia: 'Bioimpedancia',
  antropometria: 'Antropometria',
  flexibilidade: 'Flexibilidade',
  forca: 'Forca',
  rml: 'RML',
  cardiorrespiratorio: 'Cardiorrespiratorio',
  biomecanica_corrida: 'Biomecanica da corrida',
};

function textoAnalise(analise: any) {
  if (!analise) return null;
  if (typeof analise.texto_editado === 'string' && analise.texto_editado.trim()) return analise.texto_editado.trim();
  if (typeof analise.conteudo === 'string') return analise.conteudo.trim();
  const conteudo = analise.conteudo ?? {};
  const partes = [
    conteudo.resumo_clinico,
    conteudo.resumo,
    conteudo.principais_achados,
    conteudo.riscos_atencoes,
    conteudo.recomendacoes_praticas,
  ].filter(Boolean);
  return partes.length ? partes.join('\n\n') : null;
}

function achadosPorModulo(modulos: Record<string, boolean> | null | undefined, analises: any[]) {
  const mapa = Object.fromEntries((analises ?? []).map((a) => [a.tipo, a]));
  const entries = Object.entries(modulos ?? {})
    .filter(([, ativo]) => !!ativo)
    .map(([modulo]) => {
      const analise = mapa[modulo];
      const texto = textoAnalise(analise);
      return [
        modulo,
        {
          nome: LABELS_MODULOS[modulo] ?? modulo,
          analise: texto,
          revisado: Boolean(analise?.revisado_em || analise?.texto_editado || analise?.texto_paciente_editado),
        },
      ];
    });
  return Object.fromEntries(entries);
}

export async function registrarEventoProntuarioAvaliacao(admin: SupabaseAdmin, avaliacaoId: string, userId?: string | null) {
  const { data: avaliacao, error: avaliacaoError } = await admin
    .from('avaliacoes')
    .select('id, clinica_id, paciente_id, avaliador_id, data, tipo, status, modulos_selecionados')
    .eq('id', avaliacaoId)
    .maybeSingle();

  if (avaliacaoError || !avaliacao?.paciente_id || !avaliacao?.clinica_id) {
    return { ok: false, error: avaliacaoError?.message ?? 'Avaliacao sem paciente ou clinica.' };
  }

  const { data: prontuario, error: prontuarioError } = await admin
    .from('prontuarios')
    .upsert({
      clinica_id: avaliacao.clinica_id,
      paciente_id: avaliacao.paciente_id,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'paciente_id' })
    .select('id')
    .single();

  if (prontuarioError || !prontuario?.id) {
    return { ok: false, error: prontuarioError?.message ?? 'Nao foi possivel criar prontuario.' };
  }

  const [{ data: scores }, { data: analises }] = await Promise.all([
    admin.from('scores').select('*').eq('avaliacao_id', avaliacaoId).maybeSingle(),
    admin
      .from('analises_ia')
      .select('tipo, conteudo, texto_editado, conteudo_paciente, texto_paciente_editado, plano_acao, revisado_em')
      .eq('avaliacao_id', avaliacaoId),
  ]);

  const analisesLista = analises ?? [];
  const conclusao = textoAnalise(analisesLista.find((a: any) => a.tipo === 'conclusao_global'));
  const planoAcao = analisesLista.find((a: any) => a.tipo === 'conclusao_global')?.plano_acao ?? null;
  const achados = achadosPorModulo(avaliacao.modulos_selecionados, analisesLista);

  const resumo = [
    `Avaliacao ${avaliacao.tipo ?? 'personalizada'} finalizada em ${avaliacao.data}.`,
    scores?.global != null ? `Score global: ${scores.global}.` : null,
    conclusao ? 'Conclusao global registrada.' : 'Conclusao global ainda nao registrada.',
  ].filter(Boolean).join(' ');

  const { error } = await admin
    .from('prontuario_eventos')
    .upsert({
      prontuario_id: prontuario.id,
      clinica_id: avaliacao.clinica_id,
      paciente_id: avaliacao.paciente_id,
      avaliacao_id: avaliacao.id,
      tipo: 'avaliacao',
      titulo: `Avaliacao de ${avaliacao.data}`,
      data_evento: avaliacao.data,
      status: avaliacao.status === 'finalizada' ? 'finalizado' : 'registrado',
      resumo,
      achados,
      scores: scores ?? {},
      conclusao,
      plano_acao: planoAcao,
      origem: 'finalizacao_avaliacao',
      criado_por: userId ?? avaliacao.avaliador_id ?? null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'avaliacao_id,tipo' });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
