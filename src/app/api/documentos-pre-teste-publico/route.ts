import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { createAdminClient } from '@/lib/supabase/server';
import {
  cpfValido,
  DECLARACAO_ACEITE_AVULSO,
  gerarPdfEvidenciaAvulsa,
  hashConteudo,
  hashEvidencia,
  normalizarCpf,
  sha256,
  type EvidenciaAvulsa,
} from '@/lib/consentimento/evidencia-avulsa';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const { token, respostas, aceitar, signatarioNome, signatarioCpf } = await req.json();
  if (!token) return NextResponse.json({ error: 'Token inválido' }, { status: 400 });

  const admin = createAdminClient();
  const { data: envio } = await admin
    .from('documentos_pre_teste_avulsos')
    .select('*')
    .eq('token', token)
    .maybeSingle();

  if (!envio || envio.revogado || new Date(envio.expira_em).getTime() < Date.now()) {
    return NextResponse.json({ error: 'Link inválido ou expirado' }, { status: 404 });
  }

  if (envio.tipo === 'anamnese') {
    const { error } = await admin
      .from('documentos_pre_teste_avulsos')
      .update({ respostas: respostas ?? {}, respondido_em: new Date().toISOString() })
      .eq('id', envio.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  if (envio.tipo !== 'consentimento' || !aceitar) {
    return NextResponse.json({ error: 'Confirme a leitura e o aceite do termo.' }, { status: 400 });
  }

  const nome = String(signatarioNome ?? '').trim().replace(/\s+/g, ' ');
  if (nome.length < 5 || !nome.includes(' ')) {
    return NextResponse.json({ error: 'Informe o nome completo de quem está consentindo.' }, { status: 400 });
  }
  if (!cpfValido(signatarioCpf)) {
    return NextResponse.json({ error: 'Informe um CPF válido para identificar o signatário.' }, { status: 400 });
  }

  const { data: aceiteExistente } = await admin
    .from('documentos_pre_teste_aceites')
    .select('comprovante_codigo,aceito_em,nivel_evidencia')
    .eq('documento_id', envio.id)
    .maybeSingle();
  if (aceiteExistente) {
    return NextResponse.json({
      error: 'Este termo já foi aceito.',
      aceite: aceitePublico(aceiteExistente, token),
    }, { status: 409 });
  }

  const { data: modelo } = await admin
    .from('consentimento_modelos')
    .select('nome,tipo,versao,texto,texto_html')
    .eq('id', envio.modelo_id)
    .eq('clinica_id', envio.clinica_id)
    .maybeSingle();
  if (!modelo) return NextResponse.json({ error: 'Modelo do termo não encontrado.' }, { status: 404 });

  const cpf = normalizarCpf(signatarioCpf);
  const aceitoEm = new Date().toISOString();
  const id = randomUUID();
  const comprovanteCodigo = `TCLE-AV-${randomUUID().replaceAll('-', '').slice(0, 10).toUpperCase()}`;
  const conteudoHash = hashConteudo(modelo);
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || null;
  const userAgent = req.headers.get('user-agent');
  const payloadEvidencia = {
    id,
    documento_id: envio.id,
    clinica_id: envio.clinica_id,
    modelo_id: envio.modelo_id,
    modelo_nome: String(modelo.nome ?? 'Consentimento / TCLE'),
    modelo_tipo: String(modelo.tipo ?? 'tcle'),
    texto_versao: Math.max(Number(modelo.versao ?? 1), 1),
    conteudo_hash: conteudoHash,
    declaracao_aceite: DECLARACAO_ACEITE_AVULSO,
    signatario_nome: nome,
    signatario_cpf_hash: sha256(cpf),
    signatario_cpf_final: cpf.slice(-4),
    destinatario_nome: envio.destinatario_nome,
    destinatario_contato: envio.destinatario_contato,
    aceito_em: aceitoEm,
    ip,
    user_agent: userAgent,
    comprovante_codigo: comprovanteCodigo,
  };

  const { data: aceite, error: aceiteError } = await admin
    .from('documentos_pre_teste_aceites')
    .insert({
      ...payloadEvidencia,
      texto_aceito: String(modelo.texto ?? ''),
      texto_html_aceito: modelo.texto_html ? String(modelo.texto_html) : null,
      evidencia_hash: hashEvidencia(payloadEvidencia),
      nivel_evidencia: 'completo',
    })
    .select('*')
    .single();

  if (aceiteError || !aceite) {
    const duplicado = aceiteError?.code === '23505';
    return NextResponse.json({
      error: duplicado ? 'Este termo já foi aceito.' : aceiteError?.message ?? 'Não foi possível registrar o aceite.',
    }, { status: duplicado ? 409 : 400 });
  }

  const { error: updateError } = await admin
    .from('documentos_pre_teste_avulsos')
    .update({ aceito_em: aceitoEm })
    .eq('id', envio.id);

  let pdfDisponivel = false;
  try {
    const { data: clinica } = await admin
      .from('clinicas')
      .select('nome,cnpj,telefone,email,site,endereco')
      .eq('id', envio.clinica_id)
      .maybeSingle();
    const pdf = await gerarPdfEvidenciaAvulsa(aceite as EvidenciaAvulsa, clinica);
    const pdfPath = `${envio.clinica_id}/${aceite.id}.pdf`;
    const { error: uploadError } = await admin.storage
      .from('consentimento-comprovantes')
      .upload(pdfPath, pdf, { contentType: 'application/pdf', upsert: false });

    if (!uploadError) {
      const { error: pdfUpdateError } = await admin
        .from('documentos_pre_teste_aceites')
        .update({ pdf_path: pdfPath, pdf_hash: sha256(pdf) })
        .eq('id', aceite.id);
      pdfDisponivel = !pdfUpdateError;
    }
  } catch {
    // O aceite permanece valido; a rota do comprovante regenera o PDF sob demanda.
  }

  return NextResponse.json({
    ok: true,
    aceite: {
      ...aceitePublico(aceite, token),
      pdf_disponivel: pdfDisponivel,
      status_link_atualizado: !updateError,
    },
  });
}

function aceitePublico(aceite: any, token: string) {
  return {
    comprovante_codigo: aceite.comprovante_codigo,
    aceito_em: aceite.aceito_em,
    nivel_evidencia: aceite.nivel_evidencia,
    comprovante_url: `/api/documentos-pre-teste-comprovante?token=${encodeURIComponent(token)}`,
  };
}
