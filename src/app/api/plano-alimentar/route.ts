import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { calcIdade } from '@/lib/calculations/antropometria';
import {
  calcularPlanoAlimentar,
  listarFontesTmb,
  type FonteTmbPreferida,
  type ModeloPlanoAlimentar,
  type SexoNutricional,
} from '@/lib/nutrition/planoAlimentar';
import { usuarioPodeAcessarAvaliacao } from '@/lib/api/permissions';

export const runtime = 'nodejs';

function numero(v: any): number | null {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function normalizarFonteTmb(valor: unknown): FonteTmbPreferida {
  return valor === 'bioimpedancia' || valor === 'antropometria' || valor === 'mifflin_st_jeor'
    ? valor
    : 'auto';
}

async function getUserId() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

async function carregarAvaliacaoPermitida(avaliacaoId: string, userId: string) {
  const permitido = await usuarioPodeAcessarAvaliacao(userId, avaliacaoId);
  if (!permitido) return { avaliacao: null, error: 'Sem permissao para esta avaliacao' };

  const admin = createAdminClient();
  const { data: avaliacao, error } = await admin
    .from('avaliacoes')
    .select('id, clinica_id, paciente_id, avaliador_id, pacientes(*)')
    .eq('id', avaliacaoId)
    .maybeSingle();

  if (error || !avaliacao) return { avaliacao: null, error: 'Avaliacao nao encontrada' };
  return { avaliacao, error: null };
}

async function carregarDadosBase(avaliacao: any) {
  const admin = createAdminClient();
  const [bio, ant] = await Promise.all([
    admin.from('bioimpedancia').select('*').eq('avaliacao_id', avaliacao.id).maybeSingle(),
    admin.from('antropometria').select('*').eq('avaliacao_id', avaliacao.id).maybeSingle(),
  ]);

  const paciente = Array.isArray(avaliacao.pacientes) ? avaliacao.pacientes[0] : avaliacao.pacientes;
  const sexo: SexoNutricional = String(paciente?.sexo ?? '').toLowerCase().startsWith('f') ? 'F' : 'M';
  const idade = paciente?.data_nascimento ? calcIdade(paciente.data_nascimento) : null;
  const pesoKg =
    numero(bio.data?.peso_kg) ??
    numero(ant.data?.peso) ??
    numero(paciente?.peso_referencia_kg) ??
    numero(paciente?.peso_kg);
  const alturaCm =
    numero(bio.data?.altura_cm) ??
    numero(ant.data?.estatura) ??
    numero(paciente?.altura_cm) ??
    numero(paciente?.estatura_cm);
  const tmbBioimpedancia =
    numero(bio.data?.taxa_metabolica_basal_kcal) ??
    numero(bio.data?.metabolismo_basal) ??
    numero(bio.data?.tmb);
  const tmbAntropometria =
    numero(ant.data?.tmb_kcal) ??
    numero(ant.data?.metabolismo_basal) ??
    numero(ant.data?.met_basal);

  return {
    sexo,
    idade,
    pesoKg,
    alturaCm,
    tmbBioimpedancia,
    tmbAntropometria,
  };
}

function montarPreview(modelo: any, dadosBase: any) {
  if (!modelo) return null;
  const calculo = calcularPlanoAlimentar(dadosBase, modelo as ModeloPlanoAlimentar);
  return { modelo, calculo };
}

export async function GET(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Sessao expirada' }, { status: 401 });

  const avaliacaoId = req.nextUrl.searchParams.get('avaliacaoId');
  const modeloId = req.nextUrl.searchParams.get('modeloId');
  const tmbFonte = normalizarFonteTmb(req.nextUrl.searchParams.get('tmbFonte'));
  if (!avaliacaoId) return NextResponse.json({ error: 'avaliacaoId obrigatorio' }, { status: 400 });

  const { avaliacao, error } = await carregarAvaliacaoPermitida(avaliacaoId, userId);
  if (!avaliacao) return NextResponse.json({ error }, { status: error?.startsWith('Sem') ? 403 : 404 });

  const admin = createAdminClient();
  const [modelos, aplicado] = await Promise.all([
    admin
      .from('plano_alimentar_modelos')
      .select('*')
      .eq('clinica_id', avaliacao.clinica_id)
      .eq('ativo', true)
      .order('padrao', { ascending: false })
      .order('objetivo')
      .order('nome'),
    admin
      .from('plano_alimentar_avaliacoes')
      .select('*')
      .eq('avaliacao_id', avaliacaoId)
      .maybeSingle(),
  ]);

  const dadosBase = { ...(await carregarDadosBase(avaliacao)), tmbFontePreferida: tmbFonte };
  const lista = modelos.data ?? [];
  const modeloPreview =
    lista.find((m: any) => m.id === modeloId) ??
    lista.find((m: any) => m.id === aplicado.data?.modelo_id) ??
    lista[0] ??
    null;

  return NextResponse.json({
    modelos: lista,
    aplicado: aplicado.data ?? null,
    dadosBase,
    fontesTmb: listarFontesTmb(dadosBase),
    tmbFonte,
    preview: montarPreview(modeloPreview, dadosBase),
  });
}

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Sessao expirada' }, { status: 401 });

  const { avaliacaoId, modeloId, observacoes, tmbFonte } = await req.json();
  if (!avaliacaoId || !modeloId) {
    return NextResponse.json({ error: 'Avaliacao e modelo sao obrigatorios' }, { status: 400 });
  }

  const { avaliacao, error } = await carregarAvaliacaoPermitida(avaliacaoId, userId);
  if (!avaliacao) return NextResponse.json({ error }, { status: error?.startsWith('Sem') ? 403 : 404 });

  const admin = createAdminClient();
  const { data: modelo, error: modeloError } = await admin
    .from('plano_alimentar_modelos')
    .select('*')
    .eq('id', modeloId)
    .eq('clinica_id', avaliacao.clinica_id)
    .maybeSingle();

  if (modeloError || !modelo) {
    return NextResponse.json({ error: 'Modelo de orientacao nutricional nao encontrado' }, { status: 404 });
  }

  const dadosBase = { ...(await carregarDadosBase(avaliacao)), tmbFontePreferida: normalizarFonteTmb(tmbFonte) };
  const calculo = calcularPlanoAlimentar(dadosBase, modelo);
  if (!calculo.tmbKcal || !calculo.vetKcal) {
    return NextResponse.json({ error: 'Dados insuficientes para calcular TMB e VET. Confira peso, altura, sexo e idade.' }, { status: 400 });
  }

  const payload = {
    clinica_id: avaliacao.clinica_id,
    paciente_id: avaliacao.paciente_id,
    avaliacao_id: avaliacao.id,
    modelo_id: modelo.id,
    objetivo: modelo.objetivo,
    tmb_origem: calculo.tmbOrigem,
    tmb_kcal: calculo.tmbKcal,
    fator_atividade: modelo.fator_atividade,
    vet_kcal: calculo.vetKcal,
    proteina_g: calculo.proteinaG,
    carboidrato_g: calculo.carboidratoG,
    gordura_g: calculo.gorduraG,
    agua_ml: calculo.aguaMl,
    fibras_g: calculo.fibrasG,
    observacoes: observacoes ?? modelo.observacoes ?? null,
    calculo: { ...calculo, modelo: { id: modelo.id, nome: modelo.nome, objetivo: modelo.objetivo } },
    updated_at: new Date().toISOString(),
  };

  const { data, error: upsertError } = await admin
    .from('plano_alimentar_avaliacoes')
    .upsert(payload, { onConflict: 'avaliacao_id' })
    .select('*')
    .single();

  if (upsertError) return NextResponse.json({ error: upsertError.message }, { status: 400 });
  return NextResponse.json({ data, calculo });
}
