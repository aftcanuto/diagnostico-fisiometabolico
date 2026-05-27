import { NextRequest, NextResponse } from 'next/server';
import { createHash, randomUUID } from 'crypto';
import { createAdminClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

function gerarHashEvidencia(texto: string, token: string, aceitoEm: string, pacienteId: string) {
  return createHash('sha256')
    .update(`${texto}|${token}|${aceitoEm}|${pacienteId}`)
    .digest('hex');
}

export async function POST(req: NextRequest) {
  const { token } = await req.json();
  if (!token) return NextResponse.json({ error: 'Token invalido' }, { status: 400 });

  const admin = createAdminClient();
  const { data: link, error: linkError } = await admin
    .from('consentimento_links')
    .select('*, consentimento_modelos(nome,tipo,versao,texto)')
    .eq('token', token)
    .eq('revogado', false)
    .gt('expira_em', new Date().toISOString())
    .maybeSingle();

  if (linkError || !link) {
    return NextResponse.json({ error: 'Link invalido ou expirado' }, { status: 404 });
  }
  if (link.aceito_em) {
    const { data: aceite } = await admin
      .from('consentimento_aceites')
      .select('aceito_em,ip,user_agent,modelo_nome,texto_versao,revogado,revogado_em,motivo_revogacao,texto_hash,comprovante_codigo')
      .eq('token', token)
      .order('aceito_em', { ascending: false })
      .limit(1)
      .maybeSingle();
    return NextResponse.json({ error: 'Este termo ja foi aceito', aceite }, { status: 409 });
  }

  const modelo = Array.isArray(link.consentimento_modelos)
    ? link.consentimento_modelos[0]
    : link.consentimento_modelos;
  if (!modelo) return NextResponse.json({ error: 'Termo nao encontrado' }, { status: 404 });

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
  const userAgent = req.headers.get('user-agent');
  const aceitoEm = new Date().toISOString();
  const textoHash = gerarHashEvidencia(modelo.texto, token, aceitoEm, link.paciente_id);
  const comprovanteCodigo = `TCLE-${randomUUID().slice(0, 8).toUpperCase()}`;

  const { error } = await admin
    .from('consentimento_aceites')
    .insert({
      clinica_id: link.clinica_id,
      paciente_id: link.paciente_id,
      avaliacao_id: link.avaliacao_id,
      modelo_id: link.modelo_id,
      modelo_nome: modelo.nome,
      modelo_tipo: modelo.tipo,
      texto_versao: modelo.versao,
      texto_aceito: modelo.texto,
      texto_hash: textoHash,
      comprovante_codigo: comprovanteCodigo,
      ip,
      user_agent: userAgent,
      token,
      aceito_em: aceitoEm,
    });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await admin
    .from('consentimento_links')
    .update({ aceito_em: aceitoEm })
    .eq('id', link.id);

  return NextResponse.json({
    ok: true,
    aceite: {
      aceito_em: aceitoEm,
      ip,
      user_agent: userAgent,
      modelo_nome: modelo.nome,
      texto_versao: modelo.versao,
      texto_hash: textoHash,
      comprovante_codigo: comprovanteCodigo,
    },
  });
}
