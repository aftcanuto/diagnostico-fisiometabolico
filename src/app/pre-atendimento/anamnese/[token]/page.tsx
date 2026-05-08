import { notFound } from 'next/navigation';
import { unstable_noStore as noStore } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/server';
import { PublicAnamneseForm } from '@/components/PublicAnamneseForm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AnamnesePreAtendimentoPage({ params }: { params: { token: string } }) {
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

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 rounded-2xl bg-gradient-to-br from-emerald-700 to-teal-500 p-6 text-white shadow-xl">
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-100">Pré-atendimento</div>
          <h1 className="mt-2 text-2xl font-bold">Anamnese</h1>
          <p className="mt-1 text-sm text-emerald-50">{paciente?.nome ?? 'Paciente'} · {template?.nome ?? 'Formulário'}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          {template?.descricao && <p className="mb-5 text-sm text-slate-500">{template.descricao}</p>}
          <PublicAnamneseForm token={params.token} campos={campos} />
        </div>
      </div>
    </main>
  );
}
