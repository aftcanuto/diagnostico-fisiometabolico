import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/Button';
import { PatientDashboard } from '@/components/PatientDashboard';
import { ShareTokenPanel } from '@/components/ShareTokenPanel';
import { PatientEngagementPanel } from '@/components/PatientEngagementPanel';
import { Plus, ArrowLeft, BarChart2, Clock, CheckCircle, ChevronRight, Eye, RotateCcw } from 'lucide-react';
import { calcIdade } from '@/lib/calculations/antropometria';

export default async function PacienteDashboardPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: p, error: pErr } = await supabase
    .from('pacientes').select('*').eq('id', params.id).single();
  if (pErr || !p) notFound();
  const admin = createAdminClient();

  // Buscar todas as avaliações com scores para o header
  const { data: avalsLista } = await admin
    .from('avaliacoes')
    .select('id, data, tipo, status, modulos_selecionados, scores(global)')
    .eq('paciente_id', params.id)
    .order('data', { ascending: false });

  // Buscar dados completos só das finalizadas para o dashboard
  const { data: avalsCompletas } = await admin
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

  // Buscar bioimpedancia e flexibilidade separado
  const bioMap: Record<string, any> = {};
  const flexMap: Record<string, any> = {};
  const rmlMap: Record<string, any> = {};
  const biomecMap: Record<string, any> = {};
  const analisesMap: Record<string, any> = {};
  try {
    if (avalsCompletas?.length) {
      const ids = avalsCompletas.map((a: any) => a.id);
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
  } catch {}

  const { data: { user } } = await supabase.auth.getUser();
  const { data: perfil } = await supabase.from('avaliadores')
    .select('nome, crefito_crm').eq('id', user!.id).single();

  const flat = (v: any) => Array.isArray(v) ? v[0] : v;
  const avaliacoes = (avalsCompletas ?? []).map((a: any) => ({
    ...a,
    scores:              flat(a.scores),
    antropometria:       flat(a.antropometria),
    bioimpedancia:       bioMap[a.id] ?? null,
    forca:               flat(a.forca),
    flexibilidade:       flexMap[a.id] ?? null,
    rml:                 rmlMap[a.id] ?? null,
    cardiorrespiratorio: flat(a.cardiorrespiratorio),
    biomecanica_corrida: biomecMap[a.id] ?? null,
    analises_ia:         analisesMap[a.id] ?? null,
    posturografia:       flat(a.posturografia),
    sinais_vitais:       flat(a.sinais_vitais),
    anamnese:            flat(a.anamnese),
  }));

  const totalFin = avalsLista?.filter((a: any) => a.status === 'finalizada').length ?? 0;
  const emAndamento = avalsLista?.filter((a: any) => a.status !== 'finalizada') ?? [];

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <Link href="/pacientes" className="text-sm text-brand-600 hover:underline inline-flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Pacientes
        </Link>
        <div className="flex gap-2">
          {avaliacoes.length > 0 && (
            <Link href={`/pacientes/${p.id}/apresentacao`}>
              <Button variant="secondary"><Eye className="w-4 h-4" /> Modo apresentacao</Button>
            </Link>
          )}
        <Link href={`/avaliacoes/nova?pacienteId=${p.id}`}>
          <Button><Plus className="w-4 h-4" /> Nova avaliação</Button>
        </Link>
        </div>
      </div>

      {/* Info do paciente */}
      <div className="flex items-center gap-4 p-5 bg-white border border-slate-200 rounded-xl">
        <div className="w-14 h-14 rounded-full bg-brand-100 text-brand-700 grid place-items-center font-bold text-xl flex-shrink-0">
          {p.nome.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-800">{p.nome}</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {p.sexo === 'M' ? 'Masculino' : 'Feminino'} · {calcIdade(p.data_nascimento)} anos
            {p.cpf && <span className="ml-2">· CPF: {p.cpf}</span>}
            {p.email && <span className="ml-2">· {p.email}</span>}
          </p>
        </div>
        <div className="text-right hidden sm:block">
          <div className="text-2xl font-bold text-slate-800">{totalFin}</div>
          <div className="text-xs text-slate-400">avaliação{totalFin !== 1 ? 'ões' : ''}</div>
        </div>
      </div>

      {/* Avaliações em andamento */}
      {emAndamento.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Em andamento</h2>
          {emAndamento.map((a: any) => {
            const mods = a.modulos_selecionados ?? {};
            const primeiroStep = mods.anamnese ? 'anamnese'
              : mods.sinais_vitais ? 'sinais-vitais'
              : mods.posturografia ? 'posturografia'
              : mods.bioimpedancia ? 'bioimpedancia'
              : mods.antropometria ? 'antropometria'
              : mods.flexibilidade ? 'flexibilidade'
              : mods.forca ? 'forca'
              : mods.cardiorrespiratorio ? 'cardiorrespiratorio'
              : 'revisao';
            return (
              <Link key={a.id} href={`/avaliacoes/${a.id}/${primeiroStep}`}>
                <div className="flex items-center gap-4 p-4 bg-amber-50 border border-amber-200 rounded-xl hover:border-amber-300 transition cursor-pointer">
                  <Clock className="w-5 h-5 text-amber-500 flex-shrink-0"/>
                  <div className="flex-1">
                    <div className="font-medium text-slate-800">
                      {new Date(a.data).toLocaleDateString('pt-BR', { dateStyle: 'long' })}
                    </div>
                    <div className="text-xs text-amber-600 mt-0.5">{a.tipo} · Em andamento — clique para continuar</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-amber-400"/>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Avaliações finalizadas — lista com opção de reabrir */}
      {(avalsLista?.filter((a: any) => a.status === 'finalizada') ?? []).length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Avaliações finalizadas</h2>
          {(avalsLista?.filter((a: any) => a.status === 'finalizada') ?? []).map((a: any) => {
            const mods = a.modulos_selecionados ?? {};
            const primeiroStep = mods.anamnese ? 'anamnese'
              : mods.sinais_vitais ? 'sinais-vitais'
              : mods.posturografia ? 'posturografia'
              : mods.bioimpedancia ? 'bioimpedancia'
              : mods.antropometria ? 'antropometria'
              : mods.flexibilidade ? 'flexibilidade'
              : mods.forca ? 'forca'
              : mods.cardiorrespiratorio ? 'cardiorrespiratorio'
              : 'revisao';
            return (
              <div key={a.id} className="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-xl">
                <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0"/>
                <div className="flex-1">
                  <div className="font-medium text-slate-800">
                    {new Date(a.data).toLocaleDateString('pt-BR', { dateStyle: 'long' })}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">{a.tipo} · Score global: {a.scores?.[0]?.global ?? '—'}</div>
                </div>
                <form action={`/api/avaliacoes/${a.id}/reabrir`} method="POST">
                  <button type="submit" className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition">
                    <RotateCcw className="w-3.5 h-3.5" /> Reabrir
                  </button>
                </form>
                <Link href={`/avaliacoes/${a.id}/${primeiroStep}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition">
                  <Eye className="w-3.5 h-3.5" /> Ver
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {/* Portal do paciente */}
      <ShareTokenPanel pacienteId={p.id} />

      <PatientEngagementPanel pacienteId={p.id} />

      {/* Dashboard com avaliações finalizadas */}
      {avaliacoes.length > 0 ? (
        <PatientDashboard
          paciente={p}
          avaliador={{ nome: perfil?.nome ?? '', conselho: perfil?.crefito_crm ?? null }}
          avaliacoes={avaliacoes}
          pdfBaseUrl="/api/pdf?avaliacaoId="
          modo="clinico"
        />
      ) : (
        <div className="text-center py-16 bg-slate-50 rounded-xl border border-slate-100 text-slate-400">
          <BarChart2 className="w-12 h-12 mx-auto mb-3 opacity-30"/>
          <p>Nenhuma avaliação finalizada ainda.</p>
          <p className="text-sm mt-1">Finalize uma avaliação para ver o dashboard.</p>
        </div>
      )}
    </div>
  );
}
