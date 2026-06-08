import { notFound } from 'next/navigation';
import { unstable_noStore as noStore } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function RecomendacoesPreTestePage({ params }: { params: { token: string } }) {
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
    admin.from('clinicas').select('nome, logo_url, telefone, email, site').eq('id', envio.clinica_id).maybeSingle(),
    admin
      .from('protocolo_recomendacoes')
      .select('id, titulo, texto, modulo')
      .in('id', envio.recomendacoes_ids ?? [])
      .eq('ativo', true),
  ]);

  const ordem = new Map<string, number>(
    (envio.recomendacoes_ids ?? []).map((id: string, index: number) => [id, index])
  );
  const recomendacoes = [...(recomendacoesResult.data ?? [])]
    .sort((a, b) => (ordem.get(a.id) ?? 0) - (ordem.get(b.id) ?? 0));

  if (!envio.visualizado_em) {
    await admin.from('protocolo_envios').update({ visualizado_em: agora }).eq('id', envio.id);
  }

  const paciente = pacienteResult.data;
  const clinica = clinicaResult.data;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-800">
      <div className="mx-auto max-w-3xl">
        <header className="rounded-2xl bg-gradient-to-br from-emerald-800 to-teal-600 p-6 text-white shadow-xl">
          <div className="flex items-center gap-4">
            {clinica?.logo_url && (
              <img src={clinica.logo_url} alt="" className="h-14 w-14 rounded-xl bg-white object-contain p-1" />
            )}
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-100">
                {clinica?.nome ?? 'Diagnostico Fisiometabolico'}
              </div>
              <h1 className="mt-1 text-2xl font-bold">Recomendações pré-teste</h1>
              <p className="mt-1 text-sm text-emerald-50">{paciente?.nome ?? 'Paciente'}</p>
            </div>
          </div>
        </header>

        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm leading-6 text-slate-600">
            Leia estas orientações antes da avaliação. Em caso de dúvida ou impossibilidade de cumprir alguma
            recomendação, avise a equipe responsável.
          </p>
          <div className="mt-5 space-y-3">
            {recomendacoes.map(recomendacao => (
              <article key={recomendacao.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                  {String(recomendacao.modulo).replaceAll('_', ' ')}
                </div>
                <h2 className="mt-1 text-lg font-semibold text-slate-900">{recomendacao.titulo}</h2>
                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">{recomendacao.texto}</p>
              </article>
            ))}
          </div>
          {recomendacoes.length === 0 && (
            <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
              As recomendações deste link não estão mais disponíveis. Entre em contato com a clínica.
            </p>
          )}
        </section>

        <footer className="mt-5 text-center text-xs leading-5 text-slate-400">
          Link válido até {new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo' }).format(new Date(envio.expira_em))}
          {clinica?.telefone ? ` · ${clinica.telefone}` : ''}
          {clinica?.email ? ` · ${clinica.email}` : ''}
        </footer>
      </div>
    </main>
  );
}
