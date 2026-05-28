import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getUserId, usuarioPodeAcessarPaciente } from '@/lib/api/permissions';
import { registrarEventoProntuarioAvaliacao } from '@/lib/prontuario';

const TIPOS_MANUAIS = new Set(['servico', 'observacao', 'retorno', 'documento']);

async function garantirProntuario(admin: any, pacienteId: string) {
  const { data: paciente, error } = await admin
    .from('pacientes')
    .select('id, clinica_id')
    .eq('id', pacienteId)
    .maybeSingle();

  if (error || !paciente?.clinica_id) {
    return { prontuario: null, paciente: null, error: error?.message ?? 'Paciente sem clinica vinculada.' };
  }

  const { data: prontuario, error: prontuarioError } = await admin
    .from('prontuarios')
    .upsert({
      clinica_id: paciente.clinica_id,
      paciente_id: paciente.id,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'paciente_id' })
    .select('id')
    .single();

  if (prontuarioError || !prontuario?.id) {
    return { prontuario: null, paciente, error: prontuarioError?.message ?? 'Nao foi possivel criar prontuario.' };
  }

  return { prontuario, paciente, error: null };
}

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Sessao expirada' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const pacienteId = String(body.pacienteId ?? '');
  const acao = String(body.acao ?? '');
  if (!pacienteId) return NextResponse.json({ error: 'Paciente invalido' }, { status: 400 });

  if (!(await usuarioPodeAcessarPaciente(userId, pacienteId))) {
    return NextResponse.json({ error: 'Sem permissao para este paciente' }, { status: 403 });
  }

  const admin = createAdminClient();

  if (acao === 'importar_avaliacoes') {
    const { data: avaliacoes, error } = await admin
      .from('avaliacoes')
      .select('id')
      .eq('paciente_id', pacienteId)
      .eq('status', 'finalizada')
      .order('data', { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    let importadas = 0;
    const falhas: string[] = [];
    for (const avaliacao of avaliacoes ?? []) {
      const resultado = await registrarEventoProntuarioAvaliacao(admin, avaliacao.id, userId);
      if (resultado.ok) importadas += 1;
      else falhas.push(resultado.error ?? avaliacao.id);
    }

    return NextResponse.json({ importadas, falhas });
  }

  if (acao === 'criar_manual') {
    const tipo = TIPOS_MANUAIS.has(String(body.tipo)) ? String(body.tipo) : 'observacao';
    const titulo = String(body.titulo ?? '').trim();
    const dataEvento = String(body.dataEvento ?? '').trim() || new Date().toISOString().slice(0, 10);
    const resumo = String(body.resumo ?? '').trim();
    const conclusao = String(body.conclusao ?? '').trim();

    if (!titulo) return NextResponse.json({ error: 'Informe um titulo para o registro.' }, { status: 400 });
    if (!resumo && !conclusao) {
      return NextResponse.json({ error: 'Informe um resumo, achado ou conclusao.' }, { status: 400 });
    }

    const { prontuario, paciente, error } = await garantirProntuario(admin, pacienteId);
    if (error || !prontuario || !paciente) return NextResponse.json({ error }, { status: 400 });

    const { data, error: insertError } = await admin
      .from('prontuario_eventos')
      .insert({
        prontuario_id: prontuario.id,
        clinica_id: paciente.clinica_id,
        paciente_id: paciente.id,
        tipo,
        titulo,
        data_evento: dataEvento,
        status: tipo === 'observacao' ? 'registrado' : 'finalizado',
        resumo,
        conclusao: conclusao || null,
        achados: {},
        scores: {},
        origem: 'manual',
        criado_por: userId,
      })
      .select('id')
      .single();

    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 400 });
    return NextResponse.json({ data });
  }

  return NextResponse.json({ error: 'Acao invalida' }, { status: 400 });
}
