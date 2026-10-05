import { notFound } from 'next/navigation';
import { unstable_noStore as noStore } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/server';
import { DocumentoPreTestePublico } from '@/components/DocumentoPreTestePublico';
import { PublicDocumentCard, PublicDocumentLayout, publicRichTextStyles } from '@/components/PublicDocumentLayout';
import { PublicDocumentFooter } from '@/components/PublicDocumentFooter';
import { getRichTextHtml } from '@/lib/safe-rich-text';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DocumentoPreTestePage(props: { params: Promise<{ token: string }> }) {
  const { token } = await props.params;
  noStore();
  const admin = createAdminClient();
  const { data: envio } = await admin
    .from('documentos_pre_teste_avulsos')
    .select('*')
    .eq('token', token)
    .maybeSingle();
  if (!envio) notFound();

  const { data: aceite } = envio.tipo === 'consentimento'
    ? await admin
      .from('documentos_pre_teste_aceites')
      .select('comprovante_codigo,aceito_em,nivel_evidencia,modelo_nome,modelo_tipo,texto_versao,texto_aceito,texto_html_aceito')
      .eq('documento_id', envio.id)
      .maybeSingle()
    : { data: null };
  const linkInvalido = envio.revogado || new Date(envio.expira_em).getTime() < Date.now();
  if (!aceite && linkInvalido) notFound();

  const [{ data: clinica }, modeloResult, recomendacoesResult] = await Promise.all([
    admin.from('clinicas').select('nome,logo_url,telefone,email,endereco,site,instagram').eq('id', envio.clinica_id).maybeSingle(),
    envio.tipo === 'anamnese'
      ? admin.from('anamnese_templates').select('nome,descricao,campos').eq('id', envio.modelo_id).maybeSingle()
      : envio.tipo === 'consentimento'
        ? admin.from('consentimento_modelos').select('nome,descricao,texto,texto_html,tipo,versao,cor_destaque,fonte,tamanho_texto').eq('id', envio.modelo_id).maybeSingle()
        : Promise.resolve({ data: null }),
    envio.tipo === 'recomendacoes'
      ? admin.from('protocolo_recomendacoes').select('id,titulo,titulo_documento,texto,texto_html,modulo,cor_destaque,fonte,tamanho_texto').in('id', envio.recomendacoes_ids ?? []).eq('ativo', true)
      : Promise.resolve({ data: [] }),
  ]);
  if (!envio.visualizado_em) await admin.from('documentos_pre_teste_avulsos').update({ visualizado_em: new Date().toISOString() }).eq('id', envio.id);

  const modeloAtual: any = modeloResult.data;
  const modelo: any = aceite ? {
    nome: aceite.modelo_nome,
    tipo: aceite.modelo_tipo,
    versao: aceite.texto_versao,
    texto: aceite.texto_aceito,
    texto_html: aceite.texto_html_aceito,
  } : modeloAtual;
  const tituloPadrao = envio.tipo === 'anamnese'
    ? modelo?.nome ?? 'Anamnese'
    : envio.tipo === 'consentimento'
      ? modelo?.nome ?? 'Consentimento'
      : recomendacoesResult.data?.[0]?.titulo_documento || 'Recomendações pré-teste';
  const primeiroDocumento = modelo ?? recomendacoesResult.data?.[0];
  const fontFamily = fonteCss(primeiroDocumento?.fonte);
  const fontSize = tamanhoCss(primeiroDocumento?.tamanho_texto);

  return (
    <PublicDocumentLayout clinica={clinica} titulo={tituloPadrao} subtitulo={envio.destinatario_nome} fontFamily={fontFamily}>
      <PublicDocumentCard style={{ fontSize }}>
        {modelo?.descricao && <p className="mb-5 text-sm leading-6 text-[#5A5A5A]">{modelo.descricao}</p>}
        {envio.tipo === 'consentimento' && <div className="rich-text leading-7" dangerouslySetInnerHTML={{ __html: getRichTextHtml(modelo?.texto_html, modelo?.texto) }} />}
        {envio.tipo === 'anamnese' && <DocumentoPreTestePublico token={token} tipo="anamnese" campos={Array.isArray(modelo?.campos) ? modelo.campos : []} />}
        {envio.tipo === 'consentimento' && <DocumentoPreTestePublico
          token={token}
          tipo="consentimento"
          aceiteInicial={aceite ? {
            comprovante_codigo: aceite.comprovante_codigo,
            aceito_em: aceite.aceito_em,
            nivel_evidencia: aceite.nivel_evidencia,
            comprovante_url: `/api/documentos-pre-teste-comprovante?token=${encodeURIComponent(token)}`,
          } : null}
        />}
        {envio.tipo === 'recomendacoes' && (
          <div className="space-y-4">
            {(recomendacoesResult.data ?? []).map((item: any) => {
              const itemCor = corValida(item.cor_destaque);
              return (
                <article key={item.id} className="rounded-3xl border border-[#E5DDD2] bg-[#FAF5EF] p-5" style={{ borderLeftWidth: 5, borderLeftColor: itemCor, fontFamily: fonteCss(item.fonte), fontSize: tamanhoCss(item.tamanho_texto) }}>
                  {item.modulo && <div className="text-xs font-bold uppercase tracking-[0.12em]" style={{ color: itemCor }}>{String(item.modulo).replaceAll('_', ' ')}</div>}
                  <h2 className="mt-2 font-serif text-2xl font-semibold leading-tight tracking-[-0.035em] text-[#0C0C0C]">{item.titulo}</h2>
                  <div className="rich-text mt-3 leading-7" dangerouslySetInnerHTML={{ __html: getRichTextHtml(item.texto_html, item.texto) }} />
                </article>
              );
            })}
          </div>
        )}
      </PublicDocumentCard>
      <PublicDocumentFooter clinica={clinica} extra={aceite
        ? `Aceite registrado em ${new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' }).format(new Date(aceite.aceito_em))}`
        : `Link válido até ${new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo' }).format(new Date(envio.expira_em))}`}
      />
      <style>{publicRichTextStyles}</style>
    </PublicDocumentLayout>
  );
}

function corValida(value: string | null | undefined) {
  return /^#[0-9a-f]{6}$/i.test(value ?? '') ? value! : '#1D9E75';
}

function fonteCss(value: string | null | undefined) {
  return value === 'georgia' ? 'Georgia, serif' : value === 'arial' ? 'Arial, sans-serif' : 'Inter, Arial, sans-serif';
}

function tamanhoCss(value: string | null | undefined) {
  return value === 'pequeno' ? '14px' : value === 'grande' ? '18px' : '16px';
}
