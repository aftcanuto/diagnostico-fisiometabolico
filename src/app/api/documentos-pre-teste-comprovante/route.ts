import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getClinicaId, getUserId } from '@/lib/api/permissions';
import {
  gerarPdfEvidenciaAvulsa,
  sha256,
  type EvidenciaAvulsa,
} from '@/lib/consentimento/evidencia-avulsa';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  const documentoId = request.nextUrl.searchParams.get('id');
  if (!token && !documentoId) {
    return NextResponse.json({ error: 'Comprovante não informado.' }, { status: 400 });
  }

  const admin = createAdminClient();
  let idAutorizado = documentoId;

  if (token) {
    const { data: documento } = await admin
      .from('documentos_pre_teste_avulsos')
      .select('id')
      .eq('token', token)
      .maybeSingle();
    idAutorizado = documento?.id ?? null;
  } else {
    const [userId, clinicaId] = await Promise.all([getUserId(), getClinicaId()]);
    if (!userId) return NextResponse.json({ error: 'Sessão expirada.' }, { status: 401 });
    if (!clinicaId) return NextResponse.json({ error: 'Clínica não encontrada.' }, { status: 403 });

    const { data: documento } = await admin
      .from('documentos_pre_teste_avulsos')
      .select('id')
      .eq('id', documentoId)
      .eq('clinica_id', clinicaId)
      .maybeSingle();
    idAutorizado = documento?.id ?? null;
  }

  if (!idAutorizado) {
    return NextResponse.json({ error: 'Comprovante não encontrado.' }, { status: 404 });
  }

  const { data: aceite } = await admin
    .from('documentos_pre_teste_aceites')
    .select('*')
    .eq('documento_id', idAutorizado)
    .maybeSingle();
  if (!aceite) {
    return NextResponse.json({ error: 'O termo ainda não possui comprovante.' }, { status: 404 });
  }

  if (aceite.pdf_path) {
    const { data: arquivo } = await admin.storage
      .from('consentimento-comprovantes')
      .download(aceite.pdf_path);
    if (arquivo) return respostaPdf(Buffer.from(await arquivo.arrayBuffer()), aceite.comprovante_codigo);
  }

  const { data: clinica } = await admin
    .from('clinicas')
    .select('nome,cnpj,telefone,email,site,endereco')
    .eq('id', aceite.clinica_id)
    .maybeSingle();
  const pdf = await gerarPdfEvidenciaAvulsa(aceite as EvidenciaAvulsa, clinica);
  const pdfPath = `${aceite.clinica_id}/${aceite.id}.pdf`;
  const { error: uploadError } = await admin.storage
    .from('consentimento-comprovantes')
    .upload(pdfPath, pdf, { contentType: 'application/pdf', upsert: false });

  if (!uploadError) {
    await admin
      .from('documentos_pre_teste_aceites')
      .update({ pdf_path: pdfPath, pdf_hash: sha256(pdf) })
      .eq('id', aceite.id);
  }

  return respostaPdf(pdf, aceite.comprovante_codigo);
}

function respostaPdf(pdf: Buffer, codigo: string) {
  return new NextResponse(pdf as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="comprovante-${codigo}.pdf"`,
      'Cache-Control': 'private, no-store, max-age=0',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
