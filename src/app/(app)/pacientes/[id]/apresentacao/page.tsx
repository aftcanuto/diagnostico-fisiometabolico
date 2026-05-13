import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { PatientDashboard } from '@/components/PatientDashboard';

export default async function ModoApresentacaoPacientePage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const admin = createAdminClient();

  const { data: paciente, error } = await supabase.from('pacientes').select('*').eq('id', params.id).single();
  if (error || !paciente) notFound();

  const { data: avals } = await admin
    .from('avaliacoes')
    .select(`
      id, data, tipo, status, modulos_selecionados,
      scores(*), antropometria(*), forca(*),
      cardiorrespiratorio(*), posturografia(*),
      sinais_vitais(*), anamnese(*)
    `)
    .eq('paciente_id', params.id)
    .eq('status', 'finalizada')
    .order('data', { ascending: false });

  const ids = (avals ?? []).map((a: any) => a.id);
  const bioMap: Record<string, any> = {};
  const flexMap: Record<string, any> = {};
  const rmlMap: Record<string, any> = {};
  const biomecMap: Record<string, any> = {};
  const analisesMap: Record<string, any> = {};

  if (ids.length) {
    const [{ data: bios }, { data: flexs }, { data: rmls }, { data: biomecs }, { data: analises }] = await Promise.all([
      admin.from('bioimpedancia').select('*').in('avaliacao_id', ids),
      admin.from('flexibilidade').select('*').in('avaliacao_id', ids),
      admin.from('rml').select('*').in('avaliacao_id', ids),
      admin.from('biomecanica_corrida').select('*').in('avaliacao_id', ids),
      admin.from('analises_ia').select('avaliacao_id,tipo,conteudo,texto_editado,conteudo_paciente,texto_paciente_editado,plano_acao').in('avaliacao_id', ids),
    ]);
    bios?.forEach((b: any) => { bioMap[b.avaliacao_id] = b; });
    flexs?.forEach((f: any) => { flexMap[f.avaliacao_id] = f; });
    rmls?.forEach((r: any) => { rmlMap[r.avaliacao_id] = r; });
    biomecs?.forEach((b: any) => { biomecMap[b.avaliacao_id] = b; });
    analises?.forEach((a: any) => {
      analisesMap[a.avaliacao_id] ??= {};
      analisesMap[a.avaliacao_id][a.tipo] = a;
    });
  }

  const { data: { user } } = await supabase.auth.getUser();
  const { data: perfil } = await supabase.from('avaliadores').select('nome, crefito_crm').eq('id', user!.id).single();
  const flat = (v: any) => Array.isArray(v) ? v[0] : v;
  const avaliacoes = (avals ?? []).map((a: any) => ({
    ...a,
    scores: flat(a.scores),
    antropometria: flat(a.antropometria),
    bioimpedancia: bioMap[a.id] ?? null,
    forca: flat(a.forca),
    flexibilidade: flexMap[a.id] ?? null,
    rml: rmlMap[a.id] ?? null,
    cardiorrespiratorio: flat(a.cardiorrespiratorio),
    biomecanica_corrida: biomecMap[a.id] ?? null,
    analises_ia: analisesMap[a.id] ?? null,
    posturografia: flat(a.posturografia),
    sinais_vitais: flat(a.sinais_vitais),
    anamnese: flat(a.anamnese),
  }));

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <Link href={`/pacientes/${params.id}`} className="inline-flex items-center gap-1 text-sm text-brand-600 hover:underline">
        <ArrowLeft className="h-4 w-4" /> Voltar ao paciente
      </Link>
      {avaliacoes.length > 0 ? (
        <PatientDashboard
          paciente={paciente}
          avaliador={{ nome: perfil?.nome ?? '', conselho: perfil?.crefito_crm ?? null }}
          avaliacoes={avaliacoes}
          pdfBaseUrl="/api/pdf?avaliacaoId="
          modo="publico"
        />
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
          Nenhuma avaliacao finalizada para apresentar.
        </div>
      )}
    </div>
  );
}
