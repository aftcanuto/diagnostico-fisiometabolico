'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Gauge } from '@/components/ui/Gauge';
import { AnalisesIAPanel } from '@/components/AnalisesIAPanel';
import { createClient } from '@/lib/supabase/client';
import { calcIdade } from '@/lib/calculations/antropometria';
import { scoreFlexibilidade } from '@/lib/calculations/flexibilidade';
import { calcLimiteNatural } from '@/lib/calculations/limiteNatural';
import {
  scoreComposicaoCorporal, scoreCardio, scoreForca,
  scorePostura, scoreGlobal
} from '@/lib/scores';
import { FileDown, CheckCircle2, Loader2, Dumbbell } from 'lucide-react';

export default function RevisaoPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const supabase = createClient();
  const [state, setState] = useState<'loading' | 'ready' | 'finalizing'>('loading');
  const [scores, setScores] = useState<any>(null);
  const [aval, setAval] = useState<any>(null);
  const [temMultiplas, setTemMultiplas] = useState(false);
  const [limiteNatural, setLimiteNatural] = useState<any>(null);

  useEffect(() => { (async () => {
    const { data: av } = await supabase.from('avaliacoes')
      .select('*, pacientes(*)').eq('id', params.id).single();
    setAval(av);

    const [ant, fo, cr, pg, fl, outras] = await Promise.all([
      supabase.from('antropometria').select('*').eq('avaliacao_id', params.id).maybeSingle(),
      supabase.from('forca').select('*').eq('avaliacao_id', params.id).maybeSingle(),
      supabase.from('cardiorrespiratorio').select('*').eq('avaliacao_id', params.id).maybeSingle(),
      supabase.from('posturografia').select('*').eq('avaliacao_id', params.id).maybeSingle(),
      supabase.from('flexibilidade').select('*').eq('avaliacao_id', params.id).maybeSingle(),
      supabase.from('avaliacoes').select('id', { count: 'exact' })
        .eq('paciente_id', av!.paciente_id).eq('status', 'finalizada'),
    ]);

    setTemMultiplas((outras.count ?? 0) >= 1);

    const idade = calcIdade(av!.pacientes.data_nascimento);
    const sexo = av!.pacientes.sexo;
    const composicao = ant.data ? scoreComposicaoCorporal({ pctGordura: ant.data.percentual_gordura, imc: ant.data.imc, sexo }) : null;
    const temPreensao = fo.data?.preensao_dir_kgf != null && fo.data?.preensao_esq_kgf != null;
    const forca = temPreensao ? scoreForca({
      preensaoDir: Number(fo.data.preensao_dir_kgf), preensaoEsq: Number(fo.data.preensao_esq_kgf),
      sexo, idade, populacao: fo.data.populacao_ref ?? 'geral',
    }) : null;
    const cardio = cr.data ? scoreCardio({ vo2max: cr.data.vo2max, sexo, idade }) : null;
    const postura = pg.data ? scorePostura(pg.data.alinhamentos) : null;
    const flexibilidade = fl.data?.melhor_resultado != null
      ? scoreFlexibilidade(fl.data.melhor_resultado, sexo, idade)
      : null;
    const global = scoreGlobal({ postura, composicao_corporal: composicao, forca, flexibilidade, cardiorrespiratorio: cardio });

    const result = { postura, composicao_corporal: composicao, forca, flexibilidade, cardiorrespiratorio: cardio, global };
    setScores(result);

    await supabase.from('scores').upsert({
      avaliacao_id: params.id, ...result,
    }, { onConflict: 'avaliacao_id' });

    // Limite natural muscular
    if (ant.data?.massa_magra && ant.data?.estatura) {
      const ln = calcLimiteNatural({
        massaMagra: Number(ant.data.massa_magra),
        estaturaCm: Number(ant.data.estatura),
        sexo,
        massaOssea: ant.data.massa_ossea ? Number(ant.data.massa_ossea) : null,
      });
      setLimiteNatural(ln);
    }

    setState('ready');
  })(); }, [params.id, supabase]);

  async function finalizar() {
    setState('finalizing');
    await supabase.from('avaliacoes').update({ status: 'finalizada' }).eq('id', params.id);
    router.refresh();
    setState('ready');
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

      <AnalisesIAPanel
        avaliacaoId={params.id}
        modulosDisponiveis={aval.modulos_selecionados}
        temMultiplasAvaliacoes={temMultiplas}
      />

      <div className="flex flex-wrap gap-3 justify-between items-center">
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

function Stat({ label, value, sub }: { label: string; value: any; sub?: string }) {
  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-lg font-semibold text-slate-800">{value}</div>
      {sub && <div className="text-xs text-slate-500">{sub}</div>}
    </div>
  );
}
