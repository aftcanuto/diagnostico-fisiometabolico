import { notFound } from 'next/navigation';
import { unstable_noStore as noStore } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/server';
import { PublicDocumentCard, PublicDocumentLayout, publicRichTextStyles } from '@/components/PublicDocumentLayout';
import { PublicDocumentFooter } from '@/components/PublicDocumentFooter';
import { getRichTextHtml } from '@/lib/safe-rich-text';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function RecomendacoesPreTestePage(props: { params: Promise<{ token: string }> }) {
  const params = await props.params;
  noStore();
  const admin = createAdminClient();
  const agora = new Date().toISOString();

  const { data: envio } = await admin
    .from('protocolo_envios')
    .select('*')
    .eq('token', params.token)
    .eq('revogado', false)
    .gt('expira_em', agora)
    .maybeSingle();

  if (!envio) notFound();

  const [pacienteResult, clinicaResult, recomendacoesResult] = await Promise.all([
    admin.from('pacientes').select('nome').eq('id', envio.paciente_id).maybeSingle(),
    admin.from('clinicas').select('nome,logo_url,telefone,email,site,endereco,instagram').eq('id', envio.clinica_id).maybeSingle(),
    admin
      .from('protocolo_recomendacoes')
      .select('id,titulo,titulo_documento,texto,texto_html,modulo,cor_destaque,fonte,tamanho_texto')
      .in('id', envio.recomendacoes_ids ?? [])
      .eq('ativo', true),
  ]);

  const ordem = new Map<string, number>((envio.recomendacoes_ids ?? []).map((id: string, index: number) => [id, index]));
  const recomendacoes = [...(recomendacoesResult.data ?? [])].sort((a, b) => (ordem.get(a.id) ?? 0) - (ordem.get(b.id) ?? 0));

  if (!envio.visualizado_em) await admin.from('protocolo_envios').update({ visualizado_em: agora }).eq('id', envio.id);

  const paciente = pacienteResult.data;
  const clinica = clinicaResult.data;
  const titulo = recomendacoes[0]?.titulo_documento || 'Recomendações pré-teste';

  return (
    <PublicDocumentLayout clinica={clinica} titulo={titulo} subtitulo={paciente?.nome ?? 'Paciente'}>
      <PublicDocumentCard>
        <p className="text-sm leading-6 text-[#5A5A5A]">
          Leia estas orientações antes da avaliação. Em caso de dúvida ou impossibilidade de cumprir alguma recomendação, avise a equipe responsável.
        </p>
        <div className="mt-5 space-y-4">
          {recomendacoes.map(recomendacao => {
            const cor = corValida(recomendacao.cor_destaque);
            const fontFamily = fonteCss(recomendacao.fonte);
            const fontSize = tamanhoCss(recomendacao.tamanho_texto);
            return (
              <article key={recomendacao.id} className="rounded-3xl border border-[#E5DDD2] bg-[#FAF5EF] p-5" style={{ borderLeftWidth: 5, borderLeftColor: cor, fontFamily, fontSize }}>
                {recomendacao.modulo && <div className="text-xs font-bold uppercase tracking-[0.12em]" style={{ color: cor }}>{String(recomendacao.modulo).replaceAll('_', ' ')}</div>}
                <h2 className="mt-2 font-serif text-2xl font-semibold leading-tight tracking-[-0.035em] text-[#0C0C0C]">{recomendacao.titulo}</h2>
                <div className="rich-text mt-3 leading-7" dangerouslySetInnerHTML={{ __html: getRichTextHtml(recomendacao.texto_html, recomendacao.texto) }} />
              </article>
            );
          })}
        </div>
        {recomendacoes.length === 0 && (
          <p className="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            As recomendações deste link não estão mais disponíveis. Entre em contato com a clínica.
          </p>
        )}
      </PublicDocumentCard>
      <PublicDocumentFooter clinica={clinica} extra={`Link válido até ${new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo' }).format(new Date(envio.expira_em))}`} />
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
