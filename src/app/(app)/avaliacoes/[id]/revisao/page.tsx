'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Gauge } from '@/components/ui/Gauge';
import { AnalisesIAPanel } from '@/components/AnalisesIAPanel';
import { buscarModulo, upsertScores } from '@/lib/modulos';
import { createClient } from '@/lib/supabase/client';
import { calcIdade } from '@/lib/calculations/antropometria';
import { scoreFlexibilidade } from '@/lib/calculations/flexibilidade';
import { calcLimiteNatural } from '@/lib/calculations/limiteNatural';
import {
  scoreComposicaoCorporal, scoreCardio,
  scorePostura, scoreGlobal
} from '@/lib/scores';
import { numeroClinico, scoreForcaPorDadosPreensao } from '@/lib/forcaPreensao';
import { resolverPercentualGordura, type FonteGorduraRelatorio } from '@/lib/bodyComposition';
import { FileDown, CheckCircle2, Loader2, Dumbbell, AlertTriangle, ShieldCheck, Utensils, ClipboardCheck } from 'lucide-react';

export default function RevisaoPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [state, setState] = useState<'loading' | 'ready' | 'finalizing'>('loading');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [scores, setScores] = useState<any>(null);
  const [aval, setAval] = useState<any>(null);
  const [temMultiplas, setTemMultiplas] = useState(false);
  const [limiteNatural, setLimiteNatural] = useState<any>(null);
  const [checklist, setChecklist] = useState<any[]>([]);
  const [confirmarAlertas, setConfirmarAlertas] = useState(false);
  const [gorduraRelatorio, setGorduraRelatorio] = useState<any>(null);
  const [salvandoFonteGordura, setSalvandoFonteGordura] = useState(false);
  const [contextoScores, setContextoScores] = useState<any>(null);
  const [planoNutricional, setPlanoNutricional] = useState<any>({ loading: true, modelos: [], aplicado: null, preview: null });
  const [modeloPlanoId, setModeloPlanoId] = useState('');
  const [fonteTmbPlano, setFonteTmbPlano] = useState<'auto' | 'bioimpedancia' | 'antropometria' | 'mifflin_st_jeor'>('auto');
  const [observacoesPlano, setObservacoesPlano] = useState('');
  const [salvandoPlano, setSalvandoPlano] = useState(false);
  const [planoAcao, setPlanoAcao] = useState<any>({ loading: true, modelos: [], aplicado: null });
  const [modeloAcaoId, setModeloAcaoId] = useState('');
  const [planoAcaoEdit, setPlanoAcaoEdit] = useState<any>(planoAcaoVazio());
  const [salvandoPlanoAcao, setSalvandoPlanoAcao] = useState(false);

  useEffect(() => { (async () => {
    const { data: av } = await supabase.from('avaliacoes')
      .select('*, pacientes(*)').eq('id', params.id).single();
    setAval(av);

    const analisesPromise = fetch(`/api/ia/editar?avaliacaoId=${encodeURIComponent(params.id)}`, { cache: 'no-store' })
      .then(async res => {
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error ?? 'Erro ao carregar analises');
        return { data: json.data ?? [] };
      })
      .catch((error) => {
        console.error('[Revisao] Nao foi possivel carregar analises', error);
        return { data: [] };
      });

    const [anData, svData, antData, bioData, foData, crData, pgData, flData, rmlData, biomecData, analisesData, outras] = await Promise.all([
      buscarModulo('anamnese', params.id).catch(() => null),
      buscarModulo('sinais_vitais', params.id).catch(() => null),
      buscarModulo('antropometria', params.id).catch(() => null),
      buscarModulo('bioimpedancia', params.id).catch(() => null),
      buscarModulo('forca', params.id).catch(() => null),
      buscarModulo('cardiorrespiratorio', params.id).catch(() => null),
      buscarModulo('posturografia', params.id).catch(() => null),
      buscarModulo('flexibilidade', params.id).catch(() => null),
      buscarModulo('rml', params.id).catch(() => null),
      buscarModulo('biomecanica_corrida', params.id).catch(() => null),
      analisesPromise,
      supabase.from('avaliacoes').select('id', { count: 'exact' })
        .eq('paciente_id', av!.paciente_id).eq('status', 'finalizada'),
    ]);

    setTemMultiplas((outras.count ?? 0) >= 1);

    const idade = calcIdade(av!.pacientes.data_nascimento);
    const sexo = av!.pacientes.sexo;
    const gorduraEscolhida = resolverPercentualGordura(av, antData, bioData);
    setGorduraRelatorio(gorduraEscolhida);
    const pctGordura = gorduraEscolhida.valor;
    const imc = antData?.imc ?? bioData?.imc ?? null;
    const composicao = pctGordura != null && imc != null
      ? scoreComposicaoCorporal({ pctGordura, imc, sexo })
      : null;
    const forca = calcularScoreForca(foData, sexo, idade);
    const cardio = crData ? scoreCardio({ vo2max: crData.vo2max, sexo, idade }) : null;
    const postura = pgData ? scorePostura(pgData.alinhamentos) : null;
    const flexibilidade = flData?.melhor_resultado != null
      ? scoreFlexibilidade(flData.melhor_resultado, sexo, idade)
      : null;
    const global = scoreGlobal({ postura, composicao_corporal: composicao, forca, flexibilidade, cardiorrespiratorio: cardio });

    const result = { postura, composicao_corporal: composicao, forca, flexibilidade, cardiorrespiratorio: cardio, global };
    setScores(result);
    setContextoScores({ sexo, imc, postura, forca, flexibilidade, cardiorrespiratorio: cardio });
    const checklistGerado = montarChecklist(av, {
      anamnese: anData,
      sinais_vitais: svData,
      posturografia: pgData,
      bioimpedancia: bioData,
      antropometria: antData,
      flexibilidade: flData,
      forca: foData,
      rml: rmlData,
      cardiorrespiratorio: crData,
      biomecanica_corrida: biomecData,
    }, result, analisesData.data ?? [], gorduraEscolhida, {
      forcaCalculadaPorPreensao: forca != null && foiCalculadaPorPreensao(foData) && !temDinamometriaEspecifica(foData),
    });
    setChecklist(checklistGerado);

    try {
      await upsertScores(params.id, result);
      await fetch(`/api/avaliacoes/${params.id}/finalizar`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checklistFinalizacao: { itens: checklistGerado, gerado_em: new Date().toISOString() },
        }),
      });
    } catch (error) {
      console.error('[Revisao] Nao foi possivel persistir scores', error);
    }

    // Limite natural muscular
    if (antData?.massa_magra && antData?.estatura) {
      const ln = calcLimiteNatural({
        massaMagra: Number(antData.massa_magra),
        estaturaCm: Number(antData.estatura),
        sexo,
        massaOssea: antData.massa_ossea ? Number(antData.massa_ossea) : null,
      });
      setLimiteNatural(ln);
    }

    setState('ready');
    carregarPlanoAcao(av!.clinica_id, analisesData.data ?? []).catch((error) => {
      console.error('[Revisao] Nao foi possivel carregar plano de acao', error);
      setPlanoAcao((p: any) => ({ ...p, loading: false, error: error?.message ?? 'Erro ao carregar plano de acao' }));
    });
    carregarPlanoNutricional().catch((error) => {
      console.error('[Revisao] Nao foi possivel carregar orientacao nutricional', error);
      setPlanoNutricional((p: any) => ({ ...p, loading: false, error: error?.message ?? 'Erro ao carregar orientacao nutricional' }));
    });
  // carregarPlanoNutricional usa params.id e atualiza apenas a area nutricional; manter fora das dependencias evita recarregar a revisao inteira a cada simulacao de modelo.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  })(); }, [params.id, supabase]);

  async function carregarPlanoAcao(clinicaId: string, analises?: any[]) {
    const { data: modelos, error } = await supabase
      .from('plano_acao_modelos')
      .select('*')
      .eq('clinica_id', clinicaId)
      .eq('ativo', true)
      .order('padrao', { ascending: false })
      .order('objetivo')
      .order('nome');
    if (error) throw error;

    const lista = modelos ?? [];
    let analisesLista = analises;
    if (!analisesLista) {
      const res = await fetch(`/api/ia/editar?avaliacaoId=${encodeURIComponent(params.id)}`, { cache: 'no-store' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? 'Nao foi possivel carregar analises');
      analisesLista = json.data ?? [];
    }

    const aplicado = (analisesLista ?? []).find((a: any) => a.tipo === 'conclusao_global')?.plano_acao ?? null;
    const modeloBase = lista.find((m: any) => m.id === aplicado?.modelo_id) ?? lista[0] ?? null;
    const edit = normalizarPlanoAcao(aplicado ?? (modeloBase ? planoAcaoDeModelo(modeloBase) : planoAcaoVazio()));

    setPlanoAcao({ loading: false, modelos: lista, aplicado });
    setModeloAcaoId(edit.modelo_id ?? modeloBase?.id ?? '');
    setPlanoAcaoEdit(edit);
  }

  function trocarModeloAcao(modeloId: string) {
    setModeloAcaoId(modeloId);
    const modelo = planoAcao.modelos?.find((m: any) => m.id === modeloId);
    if (modelo) setPlanoAcaoEdit(planoAcaoDeModelo(modelo));
  }

  async function aplicarPlanoAcao() {
    setSalvandoPlanoAcao(true);
    setMessage(null);
    try {
      const payload = normalizarPlanoAcao({ ...planoAcaoEdit, modelo_id: modeloAcaoId || planoAcaoEdit.modelo_id });
      const res = await fetch('/api/ia/editar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avaliacaoId: params.id, tipo: 'conclusao_global', planoAcao: payload }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? 'Nao foi possivel aplicar o plano de acao.');
      setPlanoAcao((p: any) => ({ ...p, aplicado: payload }));
      setPlanoAcaoEdit(payload);
      setMessage({ type: 'success', text: 'Plano de acao aplicado nesta avaliacao.' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.message ?? 'Nao foi possivel aplicar o plano de acao.' });
    } finally {
      setSalvandoPlanoAcao(false);
    }
  }

  async function carregarPlanoNutricional(modeloId?: string, fonteTmb = fonteTmbPlano) {
    const url = new URL('/api/plano-alimentar', window.location.origin);
    url.searchParams.set('avaliacaoId', params.id);
    if (modeloId) url.searchParams.set('modeloId', modeloId);
    url.searchParams.set('tmbFonte', fonteTmb);
    const res = await fetch(url.toString(), { cache: 'no-store' });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error ?? 'Nao foi possivel carregar orientacao nutricional');
    setPlanoNutricional({ ...json, loading: false });
    const selecionado = modeloId ?? json.aplicado?.modelo_id ?? json.preview?.modelo?.id ?? json.modelos?.[0]?.id ?? '';
    setModeloPlanoId(selecionado);
    setObservacoesPlano(json.aplicado?.observacoes ?? json.preview?.modelo?.observacoes ?? '');
  }

  async function trocarModeloPlano(modeloId: string) {
    setModeloPlanoId(modeloId);
    setPlanoNutricional((p: any) => ({ ...p, loading: true }));
    try {
      await carregarPlanoNutricional(modeloId, fonteTmbPlano);
    } catch (error: any) {
      setPlanoNutricional((p: any) => ({ ...p, loading: false, error: error?.message ?? 'Erro ao simular orientacao nutricional' }));
    }
  }

  async function trocarFonteTmbPlano(fonte: 'auto' | 'bioimpedancia' | 'antropometria' | 'mifflin_st_jeor') {
    setFonteTmbPlano(fonte);
    setPlanoNutricional((p: any) => ({ ...p, loading: true }));
    try {
      await carregarPlanoNutricional(modeloPlanoId, fonte);
    } catch (error: any) {
      setPlanoNutricional((p: any) => ({ ...p, loading: false, error: error?.message ?? 'Erro ao simular orientacao nutricional' }));
    }
  }

  async function aplicarPlanoAlimentar() {
    if (!modeloPlanoId) return;
    setSalvandoPlano(true);
    setMessage(null);
    try {
      const res = await fetch('/api/plano-alimentar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avaliacaoId: params.id, modeloId: modeloPlanoId, observacoes: observacoesPlano, tmbFonte: fonteTmbPlano }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? 'Nao foi possivel aplicar a orientacao nutricional.');
      setPlanoNutricional((p: any) => ({ ...p, aplicado: json.data, preview: { ...(p.preview ?? {}), calculo: json.calculo } }));
      setMessage({ type: 'success', text: 'Orientacao nutricional aplicada nesta avaliacao.' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.message ?? 'Nao foi possivel aplicar a orientacao nutricional.' });
    } finally {
      setSalvandoPlano(false);
    }
  }

  async function escolherFonteGordura(fonte: FonteGorduraRelatorio) {
    if (!gorduraRelatorio) return;
    const valor =
      fonte === 'antropometria' ? gorduraRelatorio.antropometria :
      fonte === 'bioimpedancia' ? gorduraRelatorio.bioimpedancia :
      fonte === 'maior' ? gorduraRelatorio.maior :
      fonte === 'menor' ? gorduraRelatorio.menor :
      gorduraRelatorio.valor;
    if (valor == null) return;
    setSalvandoFonteGordura(true);
    setMessage(null);
    try {
      const composicaoAtualizada = contextoScores?.imc != null && contextoScores?.sexo
        ? scoreComposicaoCorporal({ pctGordura: valor, imc: contextoScores.imc, sexo: contextoScores.sexo })
        : scores?.composicao_corporal ?? null;
      const scoresAtualizados = {
        ...scores,
        composicao_corporal: composicaoAtualizada,
        global: scoreGlobal({
          postura: contextoScores?.postura ?? scores?.postura ?? null,
          composicao_corporal: composicaoAtualizada,
          forca: contextoScores?.forca ?? scores?.forca ?? null,
          flexibilidade: contextoScores?.flexibilidade ?? scores?.flexibilidade ?? null,
          cardiorrespiratorio: contextoScores?.cardiorrespiratorio ?? scores?.cardiorrespiratorio ?? null,
        }),
      };
      const { error } = await supabase.from('avaliacoes').update({
        fonte_gordura_relatorio: fonte,
        percentual_gordura_relatorio: valor,
      }).eq('id', params.id);
      if (error) throw error;
      await upsertScores(params.id, scoresAtualizados);
      const atualizado = {
        ...gorduraRelatorio,
        fonte,
        fonteDefinida: true,
        valor,
        conflito: false,
      };
      setGorduraRelatorio(atualizado);
      setScores(scoresAtualizados);
      setAval((a: any) => ({ ...a, fonte_gordura_relatorio: fonte, percentual_gordura_relatorio: valor }));
      setChecklist((itens) => itens.filter((item) => item.modulo !== 'gordura_relatorio'));
      setMessage({ type: 'success', text: 'Fonte de gordura corporal definida para o relatorio.' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.message ?? 'Nao foi possivel salvar a fonte de gordura.' });
    } finally {
      setSalvandoFonteGordura(false);
    }
  }

  async function finalizar() {
    setMessage(null);
    const criticos = checklist.filter(i => i.nivel === 'critico');
    const alertas = checklist.filter(i => i.nivel === 'alerta');
    if (criticos.length) {
      setMessage({ type: 'error', text: 'Existem pendências críticas no checklist antes de finalizar.' });
      return;
    }
    if (alertas.length && !confirmarAlertas) {
      setMessage({ type: 'error', text: 'Revise os alertas do checklist e marque a confirmação para finalizar.' });
      return;
    }
    setState('finalizing');
    try {
      const res = await fetch(`/api/avaliacoes/${params.id}/finalizar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checklistFinalizacao: { itens: checklist, confirmado_em: new Date().toISOString() },
          checklistAlertasConfirmados: confirmarAlertas,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? 'Nao foi possivel finalizar a avaliacao.');
      setAval((a: any) => ({ ...a, status: 'finalizada' }));
      setMessage({ type: 'success', text: 'Avaliação finalizada com sucesso.' });
      router.refresh();
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.message ?? 'Nao foi possivel finalizar a avaliacao.' });
    } finally {
      setState('ready');
    }
  }

  if (state === 'loading' || !scores || !aval) {
    return <div className="flex items-center gap-2 text-slate-500"><Loader2 className="w-4 h-4 animate-spin" /> Calculando…</div>;
  }

  return (
    <div className="space-y-5 max-w-5xl">
      <Card>
        <CardHeader><CardTitle>Resumo dos scores</CardTitle></CardHeader>
        <CardBody>
          {/* Score global em destaque */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
            <div style={{ textAlign: 'center', padding: '20px 40px',
              background: '#f0fdf4', borderRadius: 16, border: '1px solid #bbf7d0' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b',
                textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>Score Global</div>
              <div style={{ fontSize: 56, fontWeight: 900, lineHeight: 1,
                color: scores.global >= 70 ? '#10b981' : scores.global >= 40 ? '#f59e0b' : '#ef4444' }}>
                {scores.global ?? '—'}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, marginTop: 6,
                color: scores.global >= 70 ? '#10b981' : scores.global >= 40 ? '#f59e0b' : '#ef4444' }}>
                {scores.global >= 70 ? 'Ótimo' : scores.global >= 40 ? 'Atenção' : 'Crítico'}
              </div>
            </div>
          </div>
          {/* Capacidades */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4" style={{ borderTop: '1px solid #f1f5f9', paddingTop: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Gauge value={scores.postura} label="Postura" size={110} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Gauge value={scores.composicao_corporal} label="Composição" size={110} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Gauge value={scores.forca} label="Força" size={110} />
            </div>
            {scores.flexibilidade != null && (
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <Gauge value={scores.flexibilidade} label="Flexibilidade" size={110} />
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Gauge value={scores.cardiorrespiratorio} label="Cardio" size={110} />
            </div>
          </div>
        </CardBody>
      </Card>

      {limiteNatural && (
        <Card>
          <CardHeader>
            <CardTitle><Dumbbell className="inline w-4 h-4 mr-1" /> Potencial genético muscular</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <Stat label="FFMI" value={limiteNatural.ffmi} sub={limiteNatural.ffmiClassificacao} />
              <Stat label="Limite FFMI" value={limiteNatural.ffmiLimite} sub={`natural ${aval.pacientes.sexo === 'M' ? 'masculino' : 'feminino'}`} />
              <Stat label="% do potencial" value={`${limiteNatural.pctDoLimite}%`}
                    sub={limiteNatural.pctDoLimite >= 90 ? 'Próximo do limite!' : 'Margem de ganho'} />
              <Stat label="Potencial de ganho" value={`${limiteNatural.potencialGanhoKg} kg`} sub="massa magra" />
            </div>
            <div className="mb-3">
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>Massa magra atual: {limiteNatural.massaMagraAtual} kg</span>
                <span>Máx. estimado: {limiteNatural.massaMagraMaxEstimada} kg</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3">
                <div className="bg-brand-600 h-3 rounded-full transition-all" style={{ width: `${Math.min(100, limiteNatural.pctDoLimite)}%` }} />
              </div>
            </div>
            {limiteNatural.massaOsseaAtual != null && (
              <div className="grid grid-cols-3 gap-3 mb-3">
                <Stat label="Massa óssea atual" value={`${limiteNatural.massaOsseaAtual} kg`} />
                <Stat label="Massa óssea ideal" value={`${limiteNatural.massaOsseaIdeal} kg`} />
                <Stat label="Status" value={limiteNatural.osseaStatus}
                      sub={limiteNatural.osseaStatus === 'Adequada' ? '✅' : '⚠️'} />
              </div>
            )}
            <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3">{limiteNatural.resumo}</p>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            <ShieldCheck className="inline w-4 h-4 mr-1 text-brand-600" />
            Checklist de segurança antes de finalizar
          </CardTitle>
        </CardHeader>
        <CardBody className="space-y-3">
          {gorduraRelatorio?.conflito && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <div className="flex items-start gap-2 text-red-800">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <div>
                  <div className="font-semibold">Escolha a fonte de gordura corporal</div>
                  <div className="text-sm">
                    Bioimpedancia ({gorduraRelatorio.bioimpedancia}%) e antropometria ({gorduraRelatorio.antropometria}%) estao diferentes. Selecione abaixo qual valor entrara no dashboard e no relatorio.
                  </div>
                </div>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <button
                  type="button"
                  disabled={salvandoFonteGordura}
                  onClick={() => escolherFonteGordura('antropometria')}
                  className="rounded-xl border border-red-200 bg-white p-4 text-left transition hover:border-brand-400 hover:bg-brand-50 disabled:opacity-60"
                >
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Usar antropometria / dobras</div>
                  <div className="mt-1 text-3xl font-black text-slate-900">{gorduraRelatorio.antropometria}%</div>
                </button>
                <button
                  type="button"
                  disabled={salvandoFonteGordura}
                  onClick={() => escolherFonteGordura('bioimpedancia')}
                  className="rounded-xl border border-red-200 bg-white p-4 text-left transition hover:border-brand-400 hover:bg-brand-50 disabled:opacity-60"
                >
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Usar bioimpedancia</div>
                  <div className="mt-1 text-3xl font-black text-slate-900">{gorduraRelatorio.bioimpedancia}%</div>
                </button>
              </div>
            </div>
          )}
          {checklist.length === 0 ? (
            <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              Nenhuma pendência crítica ou alerta encontrado.
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {checklist.map((item, i) => (
                  <div key={`${item.modulo}-${i}`} className={`rounded-lg border px-3 py-2 text-sm ${
                    item.nivel === 'critico'
                      ? 'border-red-200 bg-red-50 text-red-800'
                      : 'border-amber-200 bg-amber-50 text-amber-800'
                  }`}>
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                      <div>
                        <div className="font-semibold">{item.titulo}</div>
                        <div>{item.descricao}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {checklist.some(i => i.nivel === 'alerta') && !checklist.some(i => i.nivel === 'critico') && (
                <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  <input type="checkbox" checked={confirmarAlertas} onChange={e => setConfirmarAlertas(e.target.checked)} />
                  Revisei os alertas não críticos e confirmo a finalização.
                </label>
              )}
            </>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle><Utensils className="inline w-4 h-4 mr-1 text-brand-600" /> Orientacao nutricional</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          {planoNutricional.loading ? (
            <div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Carregando orientacao nutricional...</div>
          ) : planoNutricional.modelos?.length ? (
            <>
              <div className="grid gap-3 md:grid-cols-[1fr,240px,220px]">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Objetivo / template</label>
                  <select
                    value={modeloPlanoId}
                    onChange={(e) => trocarModeloPlano(e.target.value)}
                    className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none focus:border-brand-400"
                  >
                    {planoNutricional.modelos.map((m: any) => (
                      <option key={m.id} value={m.id}>{m.nome} - {m.objetivo}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Fonte da TMB</label>
                  <select
                    value={fonteTmbPlano}
                    onChange={(e) => trocarFonteTmbPlano(e.target.value as any)}
                    className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none focus:border-brand-400"
                  >
                    <option value="auto">Automatica - melhor disponivel</option>
                    {(planoNutricional.fontesTmb ?? []).map((fonte: any) => (
                      <option key={fonte.id} value={fonte.id} disabled={!fonte.disponivel}>
                        {fonte.label}: {fonte.valorKcal ? `${fonte.valorKcal} kcal` : 'indisponivel'}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="rounded-xl border border-brand-100 bg-brand-50 px-4 py-3 text-sm text-brand-800">
                  <div className="text-xs font-semibold uppercase tracking-wide">TMB usada</div>
                  <div className="text-2xl font-black">{planoNutricional.preview?.calculo?.tmbKcal ?? planoNutricional.aplicado?.tmb_kcal ?? '-'} kcal</div>
                  <div className="text-xs">Origem: {planoNutricional.preview?.calculo?.tmbOrigem ?? planoNutricional.aplicado?.tmb_origem ?? '-'}</div>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-5">
                <PlanoMetric label="VET" value={planoNutricional.preview?.calculo?.vetKcal ?? planoNutricional.aplicado?.vet_kcal} unit="kcal" />
                <PlanoMetric label="Proteina" value={planoNutricional.preview?.calculo?.proteinaG ?? planoNutricional.aplicado?.proteina_g} unit="g" />
                <PlanoMetric label="Carboidrato" value={planoNutricional.preview?.calculo?.carboidratoG ?? planoNutricional.aplicado?.carboidrato_g} unit="g" />
                <PlanoMetric label="Gordura" value={planoNutricional.preview?.calculo?.gorduraG ?? planoNutricional.aplicado?.gordura_g} unit="g" />
                <PlanoMetric label="Agua" value={planoNutricional.preview?.calculo?.aguaMl ?? planoNutricional.aplicado?.agua_ml} unit="ml" />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Observacoes do plano</label>
                <textarea
                  value={observacoesPlano}
                  onChange={(e) => setObservacoesPlano(e.target.value)}
                  className="min-h-[90px] w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm outline-none focus:border-brand-400"
                  placeholder="Ajustes, distribuicao de refeicoes, observacoes clinicas ou nutricionais."
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm text-slate-500">
                  {planoNutricional.aplicado ? 'Orientacao ja aplicada nesta avaliacao. Voce pode recalcular e sobrescrever.' : 'Escolha o objetivo e a fonte da TMB para sugerir macros e salvar no laudo.'}
                </div>
                <Button onClick={aplicarPlanoAlimentar} disabled={salvandoPlano || !modeloPlanoId}>
                  {salvandoPlano ? 'Aplicando...' : 'Aplicar orientacao nutricional'}
                </Button>
              </div>
            </>
          ) : (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Nenhum template de orientacao nutricional ativo foi cadastrado. Cadastre em Configuracoes para usar esta etapa.
            </div>
          )}
          {planoNutricional.error && <div className="text-sm text-red-600">{planoNutricional.error}</div>}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle><ClipboardCheck className="inline w-4 h-4 mr-1 text-brand-600" /> Plano de acao pos-laudo</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          {planoAcao.loading ? (
            <div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Carregando modelos de plano de acao...</div>
          ) : planoAcao.modelos?.length ? (
            <>
              <div className="grid gap-3 md:grid-cols-[1fr,220px]">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Modelo de plano de acao</label>
                  <select
                    value={modeloAcaoId}
                    onChange={(e) => trocarModeloAcao(e.target.value)}
                    className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none focus:border-brand-400"
                  >
                    {planoAcao.modelos.map((m: any) => (
                      <option key={m.id} value={m.id}>{m.nome} - {m.objetivo}</option>
                    ))}
                  </select>
                </div>
                <div className="rounded-xl border border-brand-100 bg-brand-50 px-4 py-3 text-sm text-brand-800">
                  <div className="text-xs font-semibold uppercase tracking-wide">Status</div>
                  <div className="text-lg font-black">{planoAcao.aplicado ? 'Aplicado' : 'Nao aplicado'}</div>
                  <div className="text-xs">Editavel antes de finalizar</div>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <CampoPlanoAcao label="Prioridades clinicas" value={planoAcaoEdit.prioridades} onChange={(v) => setPlanoAcaoEdit((p: any) => ({ ...p, prioridades: v }))} />
                <CampoPlanoAcao label="Alertas de encaminhamento" value={planoAcaoEdit.alertas_encaminhamento} onChange={(v) => setPlanoAcaoEdit((p: any) => ({ ...p, alertas_encaminhamento: v }))} />
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <CampoPlanoAcao label="Metas de 30 dias" value={planoAcaoEdit.metas_30_dias} onChange={(v) => setPlanoAcaoEdit((p: any) => ({ ...p, metas_30_dias: v }))} />
                <CampoPlanoAcao label="Metas de 60 dias" value={planoAcaoEdit.metas_60_dias} onChange={(v) => setPlanoAcaoEdit((p: any) => ({ ...p, metas_60_dias: v }))} />
                <CampoPlanoAcao label="Metas de 90 dias" value={planoAcaoEdit.metas_90_dias} onChange={(v) => setPlanoAcaoEdit((p: any) => ({ ...p, metas_90_dias: v }))} />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {[
                  ['composicao_corporal', 'Composicao corporal'],
                  ['forca', 'Forca'],
                  ['flexibilidade', 'Flexibilidade'],
                  ['cardiorrespiratorio', 'Cardiorrespiratorio'],
                  ['rml', 'RML'],
                  ['postura', 'Postura'],
                  ['biomecanica', 'Biomecanica'],
                ].map(([key, label]) => (
                  <CampoPlanoAcao
                    key={key}
                    label={label}
                    value={planoAcaoEdit.recomendacoes?.[key] ?? ''}
                    onChange={(v) => setPlanoAcaoEdit((p: any) => ({ ...p, recomendacoes: { ...(p.recomendacoes ?? {}), [key]: v } }))}
                  />
                ))}
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Previa do que ira para dashboards e PDF</div>
                <div className="max-h-48 overflow-auto whitespace-pre-line text-sm leading-relaxed text-slate-700">{textoPlanoAcaoPreview(planoAcaoEdit)}</div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm text-slate-500">Ao aplicar, o plano fica salvo na conclusao global e aparece no dashboard clinico, portal do paciente e PDF.</div>
                <Button onClick={aplicarPlanoAcao} disabled={salvandoPlanoAcao || !modeloAcaoId}>
                  {salvandoPlanoAcao ? 'Aplicando...' : 'Aplicar plano de acao'}
                </Button>
              </div>
            </>
          ) : (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Nenhum modelo de plano de acao ativo foi cadastrado. Cadastre em Configuracoes para usar esta etapa.
            </div>
          )}
          {planoAcao.error && <div className="text-sm text-red-600">{planoAcao.error}</div>}
        </CardBody>
      </Card>

      <AnalisesIAPanel
        avaliacaoId={params.id}
        modulosDisponiveis={aval.modulos_selecionados}
        temMultiplasAvaliacoes={temMultiplas}
      />

      <div className="flex flex-wrap gap-3 justify-between items-center">
        {message && (
          <div className={`w-full rounded-lg border px-3 py-2 text-sm ${
            message.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}>
            {message.text}
          </div>
        )}
        <div className="text-sm text-slate-500">
          {aval.status === 'finalizada'
            ? <span className="inline-flex items-center gap-1 text-emerald-600"><CheckCircle2 className="w-4 h-4" /> Avaliação finalizada</span>
            : 'Você pode voltar e editar qualquer módulo.'}
        </div>
        <div className="flex gap-2">
          <a href={`/api/pdf?avaliacaoId=${params.id}`} target="_blank" rel="noreferrer">
            <Button variant="secondary"><FileDown className="w-4 h-4" /> Baixar PDF</Button>
          </a>
          {aval.status !== 'finalizada' && (
            <Button onClick={finalizar} disabled={state === 'finalizing'}>
              {state === 'finalizing' ? 'Finalizando…' : 'Finalizar avaliação'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function calcularScoreForca(dados: any, sexo: any, idade: number): number | null {
  if (!dados) return null;

  const scorePreensao = scoreForcaPorDadosPreensao(dados, sexo, idade);
  if (scorePreensao != null) return scorePreensao;

  const assimetrias = [
    ...(Array.isArray(dados.sptech_testes) ? dados.sptech_testes : []),
    ...(Array.isArray(dados.tracao_testes) ? dados.tracao_testes : []),
  ]
    .map((t: any) => Number(t.assimetria_pct))
    .filter((v: number) => Number.isFinite(v));

  const temDinamometria = [
    ...(Array.isArray(dados.sptech_testes) ? dados.sptech_testes : []),
    ...(Array.isArray(dados.tracao_testes) ? dados.tracao_testes : []),
  ].some((t: any) =>
    Number(t?.lado_d?.kgf ?? t?.lado_d?.fim_kgf ?? 0) > 0 ||
    Number(t?.lado_e?.kgf ?? t?.lado_e?.fim_kgf ?? 0) > 0
  );

  if (!temDinamometria) return null;
  if (!assimetrias.length) return 70;

  const mediaAssimetria = assimetrias.reduce((sum, v) => sum + v, 0) / assimetrias.length;
  return Math.max(0, Math.min(100, Math.round(85 - mediaAssimetria * 2)));
}

function foiCalculadaPorPreensao(dados: any) {
  if (!dados) return false;
  const dir = numeroClinico(dados.preensao_dir_kgf ?? dados.preensao_direita_kgf ?? dados.preensao_dir ?? dados.preensao_direita);
  const esq = numeroClinico(dados.preensao_esq_kgf ?? dados.preensao_esquerda_kgf ?? dados.preensao_esq ?? dados.preensao_esquerda);
  return (dir != null && dir > 0) || (esq != null && esq > 0);
}

function temDinamometriaEspecifica(dados: any) {
  if (!dados) return false;
  return [
    ...(Array.isArray(dados.sptech_testes) ? dados.sptech_testes : []),
    ...(Array.isArray(dados.tracao_testes) ? dados.tracao_testes : []),
  ].some((t: any) =>
    Number(t?.lado_d?.kgf ?? t?.lado_d?.fim_kgf ?? 0) > 0 ||
    Number(t?.lado_e?.kgf ?? t?.lado_e?.fim_kgf ?? 0) > 0
  );
}

function montarChecklist(
  aval: any,
  modulosDados: Record<string, any>,
  scores: any,
  analises: any[],
  gorduraRelatorio?: any,
  contexto?: { forcaCalculadaPorPreensao?: boolean }
) {
  const itens: any[] = [];
  const mods = aval?.modulos_selecionados ?? {};
  const labels: Record<string, string> = {
    anamnese: 'Anamnese',
    sinais_vitais: 'Sinais vitais',
    posturografia: 'Posturografia',
    bioimpedancia: 'Bioimpedância',
    antropometria: 'Antropometria',
    flexibilidade: 'Flexibilidade',
    forca: 'Força',
    rml: 'RML',
    cardiorrespiratorio: 'Cardiorrespiratório',
    biomecanica_corrida: 'Biomecânica da corrida',
  };

  if (gorduraRelatorio?.conflito) {
    itens.push({
      nivel: 'critico',
      modulo: 'gordura_relatorio',
      titulo: 'Escolha a fonte de gordura corporal',
      descricao: `Bioimpedancia (${gorduraRelatorio.bioimpedancia}%) e antropometria (${gorduraRelatorio.antropometria}%) estao diferentes. Defina qual valor deve entrar no dashboard e no relatorio.`,
    });
  }

  Object.entries(mods).forEach(([modulo, ativo]) => {
    if (!ativo || modulo === 'revisao') return;
    const dados = modulosDados[modulo];
    if (!temDadosModulo(dados)) {
      itens.push({
        nivel: 'critico',
        modulo,
        titulo: `${labels[modulo] ?? modulo} sem dados`,
        descricao: 'O módulo foi selecionado, mas ainda não possui informações salvas.',
      });
    }
  });

  if (mods.posturografia && modulosDados.posturografia) {
    const fotos = [
      ['foto_anterior', 'foto_frente_url', 'foto_frente'],
      ['foto_posterior', 'foto_costas_url', 'foto_costas'],
      ['foto_lateral_dir', 'foto_lateral_dir_url'],
      ['foto_lateral_esq', 'foto_lateral_esq_url'],
    ];
    const faltando = fotos.filter(opcoes => !opcoes.some(k => Boolean(modulosDados.posturografia?.[k])));
    if (faltando.length) {
      itens.push({
        nivel: 'alerta',
        modulo: 'posturografia',
        titulo: 'Fotos de posturografia incompletas',
        descricao: `${faltando.length} foto(s) não foram anexadas. O laudo pode sair com espaço reservado.`,
      });
    }
  }

  const incoerencias = checarValoresIncoerentes(modulosDados, aval);
  if (incoerencias.length) {
    itens.push({
      nivel: 'alerta',
      modulo: 'valores',
      titulo: 'Valores fora da faixa esperada',
      descricao: incoerencias.join(' | '),
    });
  }

  const scoresCriticos = Object.entries(scores ?? {})
    .filter(([k, v]) => {
      if (k === 'global') return false;
      if (k === 'forca' && contexto?.forcaCalculadaPorPreensao) return false;
      return v == null || Number(v) === 0;
    })
    .map(([k]) => labels[k] ?? k.replace(/_/g, ' '));
  if (scoresCriticos.length) {
    itens.push({
      nivel: 'alerta',
      modulo: 'scores',
      titulo: 'Scores ausentes ou zerados',
      descricao: `Revise: ${scoresCriticos.join(', ')}.`,
    });
  }

  if (contexto?.forcaCalculadaPorPreensao) {
    itens.push({
      nivel: 'alerta',
      modulo: 'forca_preensao',
      titulo: 'Forca calculada pela preensao palmar',
      descricao: 'O score de forca foi calculado pela preensao palmar. Como a dinamometria isometrica especifica nao foi preenchida, a analise muscular segmentar ficara limitada.',
    });
  }

  const tiposGerados = new Set((analises ?? []).map((a: any) => a.tipo));
  const analisesFaltantes = Object.entries(mods)
    .filter(([modulo, ativo]) => ativo && modulo !== 'revisao' && !tiposGerados.has(modulo))
    .map(([modulo]) => labels[modulo] ?? modulo);
  if (!tiposGerados.has('conclusao_global')) analisesFaltantes.push('Conclusão global');
  if (analisesFaltantes.length) {
    itens.push({
      nivel: 'alerta',
      modulo: 'ia',
      titulo: 'Análises clínicas ausentes',
      descricao: `Ainda não há análise de IA/revisada para: ${analisesFaltantes.join(', ')}.`,
    });
  }

  const analisesNaoRevisadas = (analises ?? [])
    .filter((a: any) => a?.tipo && (a.conteudo || a.conteudo_paciente) && !a.texto_editado && !a.texto_paciente_editado)
    .map((a: any) => labels[a.tipo] ?? a.tipo);
  if (analisesNaoRevisadas.length) {
    itens.push({
      nivel: 'alerta',
      modulo: 'ia',
      titulo: 'Analises de IA ainda nao revisadas',
      descricao: `Revise ou edite as analises antes da entrega: ${analisesNaoRevisadas.join(', ')}.`,
    });
  }

  const publicos = modulosDados.anamnese?.respostas?.__campos_publicos_relatorio;
  if (publicos && Object.values(publicos).some(Boolean)) {
    itens.push({
      nivel: 'alerta',
      modulo: 'anamnese',
      titulo: 'Anamnese com campos liberados ao paciente',
      descricao: 'Confirme se os campos marcados não contêm informações sensíveis antes de finalizar.',
    });
  }

  return itens;
}

function temDadosModulo(dados: any) {
  if (!dados) return false;
  return Object.entries(dados).some(([k, v]) => {
    if (['id', 'avaliacao_id', 'created_at', 'updated_at'].includes(k)) return false;
    if (v == null || v === '') return false;
    if (typeof v === 'object') return Object.keys(v as any).length > 0;
    return true;
  });
}

function checarValoresIncoerentes(modulosDados: Record<string, any>, aval: any) {
  const avisos: string[] = [];
  const sv = modulosDados.sinais_vitais ?? {};
  const bio = modulosDados.bioimpedancia ?? {};
  const ant = modulosDados.antropometria ?? {};
  const cardio = modulosDados.cardiorrespiratorio ?? {};
  const flex = modulosDados.flexibilidade ?? {};
  const idade = aval?.pacientes?.data_nascimento ? calcIdade(aval.pacientes.data_nascimento) : null;

  addRange(avisos, 'FC repouso', sv.fc_repouso, 30, 220, 'bpm');
  addRange(avisos, 'SpO2', sv.spo2, 70, 100, '%');
  addRange(avisos, 'Temperatura', sv.temperatura, 30, 43, 'C');
  addRange(avisos, 'Frequencia respiratoria', sv.fr, 4, 60, 'irpm');
  addRange(avisos, 'Peso', ant.peso ?? bio.peso_kg, 25, 350, 'kg');
  addRange(avisos, 'Estatura', ant.estatura ?? bio.altura_cm, 100, 230, 'cm');
  addRange(avisos, 'IMC', ant.imc ?? bio.imc, 10, 80, '');
  addRange(avisos, 'Gordura corporal', ant.percentual_gordura ?? bio.percentual_gordura, 3, 70, '%');
  addRange(avisos, 'VO2max', cardio.vo2max, 5, 90, 'ml/kg/min');
  addRange(avisos, 'Flexibilidade Banco de Wells', flex.melhor_resultado, -40, 80, 'cm');
  if (idade != null && (idade < 5 || idade > 110)) avisos.push(`Idade calculada fora do esperado: ${idade} anos`);
  return avisos;
}

function addRange(avisos: string[], label: string, valor: any, min: number, max: number, unidade: string) {
  if (valor == null || valor === '') return;
  const n = Number(valor);
  if (!Number.isFinite(n)) return;
  if (n < min || n > max) avisos.push(`${label}: ${n}${unidade ? ` ${unidade}` : ''}`);
}

function Stat({ label, value, sub }: { label: string; value: any; sub?: string }) {
  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-lg font-semibold text-slate-800">{value}</div>
      {sub && <div className="text-xs text-slate-500">{sub}</div>}
    </div>
  );
}

function PlanoMetric({ label, value, unit }: { label: string; value: any; unit: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-1 text-xl font-black text-slate-900">
        {value ?? '-'} <span className="text-xs font-medium text-slate-500">{unit}</span>
      </div>
    </div>
  );
}

function CampoPlanoAcao({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</label>
      <textarea
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[86px] w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm outline-none focus:border-brand-400"
      />
    </div>
  );
}

function planoAcaoVazio() {
  return {
    modelo_id: '',
    objetivo: 'personalizado',
    nome: '',
    prioridades: '',
    metas_30_dias: '',
    metas_60_dias: '',
    metas_90_dias: '',
    recomendacoes: {},
    alertas_encaminhamento: '',
  };
}

function planoAcaoDeModelo(modelo: any) {
  return normalizarPlanoAcao({
    modelo_id: modelo.id,
    objetivo: modelo.objetivo,
    nome: modelo.nome,
    prioridades: modelo.prioridades,
    metas_30_dias: modelo.metas_30_dias,
    metas_60_dias: modelo.metas_60_dias,
    metas_90_dias: modelo.metas_90_dias,
    recomendacoes: modelo.recomendacoes ?? {},
    alertas_encaminhamento: modelo.alertas_encaminhamento,
  });
}

function normalizarPlanoAcao(valor: any) {
  if (!valor) return planoAcaoVazio();
  if (typeof valor === 'string') return { ...planoAcaoVazio(), prioridades: valor };
  if (valor.texto && Object.keys(valor).length <= 2) return { ...planoAcaoVazio(), prioridades: valor.texto };
  return {
    ...planoAcaoVazio(),
    ...valor,
    recomendacoes: valor.recomendacoes && typeof valor.recomendacoes === 'object' ? valor.recomendacoes : {},
  };
}

function textoPlanoAcaoPreview(plano: any) {
  const recomendacoes = plano?.recomendacoes ?? {};
  const areas = [
    ['composicao_corporal', 'Composicao corporal'],
    ['forca', 'Forca'],
    ['flexibilidade', 'Flexibilidade'],
    ['cardiorrespiratorio', 'Cardiorrespiratorio'],
    ['rml', 'RML'],
    ['postura', 'Postura'],
    ['biomecanica', 'Biomecanica'],
  ];
  return [
    plano?.prioridades ? `PRIORIDADES\n${plano.prioridades}` : '',
    plano?.metas_30_dias ? `30 DIAS\n${plano.metas_30_dias}` : '',
    plano?.metas_60_dias ? `60 DIAS\n${plano.metas_60_dias}` : '',
    plano?.metas_90_dias ? `90 DIAS\n${plano.metas_90_dias}` : '',
    ...areas.map(([key, label]) => recomendacoes[key] ? `${label.toUpperCase()}\n${recomendacoes[key]}` : ''),
    plano?.alertas_encaminhamento ? `ALERTAS DE ENCAMINHAMENTO\n${plano.alertas_encaminhamento}` : '',
  ].filter(Boolean).join('\n\n');
}
