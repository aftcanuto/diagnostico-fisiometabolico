import { notFound } from 'next/navigation';
import { unstable_noStore as noStore } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/server';
import { PublicConsentimentoAccept } from '@/components/PublicConsentimentoAccept';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ConsentimentoPreAtendimentoPage({ params }: { params: { token: string } }) {
  noStore();
  const admin = createAdminClient();
  const { data: link } = await admin
    .from('consentimento_links')
    .select('*, pacientes(nome), consentimento_modelos(nome,descricao,tipo,versao,texto)')
    .eq('token', params.token)
    .eq('revogado', false)
    .gt('expira_em', new Date().toISOString())
    .maybeSingle();

  if (!link) notFound();
  const modelo = Array.isArray(link.consentimento_modelos) ? link.consentimento_modelos[0] : link.consentimento_modelos;
  const paciente = Array.isArray(link.pacientes) ? link.pacientes[0] : link.pacientes;
  if (!modelo) notFound();

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 rounded-2xl bg-gradient-to-br from-emerald-700 to-teal-500 p-6 text-white shadow-xl">
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-100">Consentimento digital</div>
          <h1 className="mt-2 text-2xl font-bold">{modelo.nome}</h1>
          <p className="mt-1 text-sm text-emerald-50">
            {paciente?.nome ?? 'Paciente'} · {modelo.tipo === 'tcle' ? 'TCLE' : 'Consentimento'} · versao {modelo.versao}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          {modelo.descricao && <p className="mb-5 text-sm text-slate-500">{modelo.descricao}</p>}
          <div className="prose prose-slate max-w-none whitespace-pre-wrap text-sm leading-7 text-slate-700">
            {modelo.texto}
          </div>
          <PublicConsentimentoAccept token={params.token} />
        </div>
      </div>
    </main>
  );
}
