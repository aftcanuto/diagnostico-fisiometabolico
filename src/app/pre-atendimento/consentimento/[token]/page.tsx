import { notFound } from 'next/navigation';
import { unstable_noStore as noStore } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/server';
import { PublicConsentimentoAccept } from '@/components/PublicConsentimentoAccept';
import { PublicDocumentCard, PublicDocumentLayout, publicRichTextStyles } from '@/components/PublicDocumentLayout';
import { PublicDocumentFooter } from '@/components/PublicDocumentFooter';
import { getRichTextHtml } from '@/lib/safe-rich-text';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ConsentimentoPreAtendimentoPage(props: { params: Promise<{ token: string }> }) {
  const params = await props.params;
  noStore();
  const admin = createAdminClient();
  const { data: link } = await admin
    .from('consentimento_links')
    .select('*, pacientes(nome), consentimento_modelos(nome,descricao,tipo,versao,texto,texto_html,cor_destaque,fonte,tamanho_texto)')
    .eq('token', params.token)
    .maybeSingle();

  if (!link) notFound();
  const modelo = Array.isArray(link.consentimento_modelos) ? link.consentimento_modelos[0] : link.consentimento_modelos;
  const paciente = Array.isArray(link.pacientes) ? link.pacientes[0] : link.pacientes;
  if (!modelo) notFound();
  const { data: clinica } = await admin
    .from('clinicas')
    .select('nome,logo_url,endereco,telefone,email,site,instagram')
    .eq('id', link.clinica_id)
    .maybeSingle();
  const fontFamily = modelo.fonte === 'georgia' ? 'Georgia, serif' : modelo.fonte === 'arial' ? 'Arial, sans-serif' : 'Inter, Arial, sans-serif';
  const fontSize = modelo.tamanho_texto === 'pequeno' ? '14px' : modelo.tamanho_texto === 'grande' ? '18px' : '16px';

  const { data: aceite } = await admin
    .from('consentimento_aceites')
    .select('aceito_em,ip,user_agent,modelo_nome,texto_versao,revogado,revogado_em,motivo_revogacao')
    .eq('token', params.token)
    .order('aceito_em', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!aceite && (link.revogado || new Date(link.expira_em).getTime() < Date.now())) notFound();

  const subtitulo = `${paciente?.nome ?? 'Paciente'} · ${modelo.tipo === 'tcle' ? 'TCLE' : 'Consentimento'} · versão ${modelo.versao}`;

  return (
    <PublicDocumentLayout clinica={clinica} titulo={modelo.nome} subtitulo={subtitulo} fontFamily={fontFamily}>
      <PublicDocumentCard>
        {modelo.descricao && <p className="mb-5 text-sm leading-6 text-[#5A5A5A]">{modelo.descricao}</p>}
        <div className="rich-text max-w-none leading-7" style={{ fontSize }} dangerouslySetInnerHTML={{ __html: getRichTextHtml(modelo.texto_html, modelo.texto) }} />
        <PublicConsentimentoAccept token={params.token} aceiteInicial={aceite ?? (link.aceito_em ? { aceito_em: link.aceito_em, texto_versao: modelo.versao, modelo_nome: modelo.nome } : null)} />
      </PublicDocumentCard>
      <PublicDocumentFooter clinica={clinica} extra={`Link válido até ${new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo' }).format(new Date(link.expira_em))}`} />
      <style>{publicRichTextStyles}</style>
    </PublicDocumentLayout>
  );
}
