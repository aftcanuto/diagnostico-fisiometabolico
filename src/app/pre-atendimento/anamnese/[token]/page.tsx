import { notFound } from 'next/navigation';
import { unstable_noStore as noStore } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/server';
import { PublicAnamneseForm } from '@/components/PublicAnamneseForm';
import { PublicDocumentCard, PublicDocumentLayout } from '@/components/PublicDocumentLayout';
import { PublicDocumentFooter } from '@/components/PublicDocumentFooter';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AnamnesePreAtendimentoPage(props: { params: Promise<{ token: string }> }) {
  const params = await props.params;
  noStore();
  const admin = createAdminClient();
  const { data: link } = await admin
    .from('paciente_anamnese_links')
    .select('*, pacientes(nome), anamnese_templates(nome, descricao, campos)')
    .eq('token', params.token)
    .eq('revogado', false)
    .gt('expira_em', new Date().toISOString())
    .maybeSingle();

  if (!link) notFound();
  const template = Array.isArray(link.anamnese_templates) ? link.anamnese_templates[0] : link.anamnese_templates;
  const paciente = Array.isArray(link.pacientes) ? link.pacientes[0] : link.pacientes;
  const campos = Array.isArray(template?.campos) ? template.campos : [];
  const { data: clinica } = await admin
    .from('clinicas')
    .select('nome,logo_url,endereco,telefone,email,site,instagram')
    .eq('id', link.clinica_id)
    .maybeSingle();

  return (
    <PublicDocumentLayout clinica={clinica} titulo="Anamnese" subtitulo={`${paciente?.nome ?? 'Paciente'} · ${template?.nome ?? 'Formulário'}`}>
      <PublicDocumentCard>
        {template?.descricao && <p className="mb-5 text-sm leading-6 text-[#5A5A5A]">{template.descricao}</p>}
        <PublicAnamneseForm token={params.token} campos={campos} />
      </PublicDocumentCard>
      <PublicDocumentFooter clinica={clinica} extra={`Link válido até ${new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo' }).format(new Date(link.expira_em))}`} />
    </PublicDocumentLayout>
  );
}
