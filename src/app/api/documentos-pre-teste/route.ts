import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getClinicaId, getUserId, recomendacoesAtivasDaClinica, templateAnamneseAtivoDaClinica } from '@/lib/api/permissions';

export const runtime = 'nodejs';

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Sessão expirada' }, { status: 401 });
  const clinicaId = await getClinicaId();
  if (!clinicaId) return NextResponse.json({ error: 'Clínica não encontrada' }, { status: 403 });

  const admin = createAdminClient();
  const [{ data: anamneses }, { data: consentimentos }, { data: recomendacoes }, { data: envios, error }] = await Promise.all([
    admin.from('anamnese_templates').select('id,nome,descricao').eq('clinica_id', clinicaId).eq('ativo', true).order('nome'),
    admin.from('consentimento_modelos').select('id,nome,tipo,versao').eq('clinica_id', clinicaId).eq('ativo', true).order('nome'),
    admin.from('protocolo_recomendacoes').select('id,titulo,titulo_documento,modulo').eq('clinica_id', clinicaId).eq('ativo', true).order('modulo').order('titulo'),
    admin.from('documentos_pre_teste_avulsos').select('*').eq('clinica_id', clinicaId).or('revogado.eq.false,aceito_em.not.is.null').order('created_at', { ascending: false }).limit(12),
  ]);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const idsConsentimento = (envios ?? [])
    .filter((envio: any) => envio.tipo === 'consentimento')
    .map((envio: any) => envio.id);
  const { data: aceites } = idsConsentimento.length
    ? await admin
      .from('documentos_pre_teste_aceites')
      .select('documento_id,comprovante_codigo,aceito_em,nivel_evidencia,revogado')
      .in('documento_id', idsConsentimento)
    : { data: [] };
  const aceitePorDocumento = new Map((aceites ?? []).map((aceite: any) => [aceite.documento_id, aceite]));
  const enviosComAceite = (envios ?? []).map((envio: any) => ({
    ...envio,
    aceite: aceitePorDocumento.get(envio.id) ?? null,
  }));

  return NextResponse.json({ anamneses: anamneses ?? [], consentimentos: consentimentos ?? [], recomendacoes: recomendacoes ?? [], envios: enviosComAceite });
}

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Sessão expirada' }, { status: 401 });
  const clinicaId = await getClinicaId();
  if (!clinicaId) return NextResponse.json({ error: 'Clínica não encontrada' }, { status: 403 });

  const { tipo, modeloId, recomendacoesIds, destinatarioNome, destinatarioContato } = await req.json();
  if (!['anamnese', 'consentimento', 'recomendacoes'].includes(tipo)) {
    return NextResponse.json({ error: 'Tipo de documento inválido' }, { status: 400 });
  }

  const admin = createAdminClient();
  if (tipo === 'anamnese' && !(await templateAnamneseAtivoDaClinica(modeloId, clinicaId))) {
    return NextResponse.json({ error: 'Modelo de anamnese inválido' }, { status: 400 });
  }
  if (tipo === 'consentimento') {
    const { data } = await admin.from('consentimento_modelos').select('id').eq('id', modeloId).eq('clinica_id', clinicaId).eq('ativo', true).maybeSingle();
    if (!data) return NextResponse.json({ error: 'Modelo de consentimento inválido' }, { status: 400 });
  }
  const ids = Array.isArray(recomendacoesIds) ? recomendacoesIds : [];
  if (tipo === 'recomendacoes' && (ids.length === 0 || (await recomendacoesAtivasDaClinica(ids, clinicaId)).length !== new Set(ids).size)) {
    return NextResponse.json({ error: 'Selecione recomendações válidas' }, { status: 400 });
  }

  const { data, error } = await admin.from('documentos_pre_teste_avulsos').insert({
    clinica_id: clinicaId,
    tipo,
    token: crypto.randomUUID(),
    destinatario_nome: destinatarioNome?.trim() || null,
    destinatario_contato: destinatarioContato?.trim() || null,
    modelo_id: tipo === 'recomendacoes' ? null : modeloId,
    recomendacoes_ids: tipo === 'recomendacoes' ? ids : [],
    titulo_personalizado: null,
    mensagem_personalizada: null,
    cor_primaria: '#047857',
    fonte: 'inter',
    tamanho_texto: 'medio',
    criado_por: userId,
  }).select('*').single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}

export async function PATCH(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Sessão expirada' }, { status: 401 });
  const clinicaId = await getClinicaId();
  const { id } = await req.json();
  if (!clinicaId || !id) return NextResponse.json({ error: 'Link inválido' }, { status: 400 });
  const admin = createAdminClient();
  const { data, error } = await admin.from('documentos_pre_teste_avulsos').update({ revogado: true }).eq('id', id).eq('clinica_id', clinicaId).select('id').maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!data) return NextResponse.json({ error: 'Link não encontrado ou já revogado' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
