'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Field, Input, Select, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { SaveIndicator } from '@/components/ui/SaveIndicator';
import { buscarModulo, upsertModulo } from '@/lib/modulos';
import { useAutoSave } from '@/lib/useAutoSave';
import { createClient } from '@/lib/supabase/client';
import { fcMaxTanaka, zonasTreinamento, classificaVO2 } from '@/lib/calculations/cardio';
import { calcIdade } from '@/lib/calculations/antropometria';
import { Plus, Trash2 } from 'lucide-react';
import { buildSteps } from '@/lib/steps';

const INTENSIDADES = [60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115];
const INTENS_VEL   = [60, 65, 70, 75, 80, 85, 90, 95, 100];
const REC_SEGUNDOS = [10, 30, 60];

const ZONAS_LIMIAR_DEFAULT = [
  { nome: 'Saúde Cardiovascular', pct_min: 50,  pct_max: 72,  bpm_min: '', bpm_max: '' },
  { nome: 'Emagrecimento',        pct_min: 72,  pct_max: 99,  bpm_min: '', bpm_max: '' },
  { nome: 'Performance',          pct_min: 100, pct_max: 110, bpm_min: '', bpm_max: '' },
  { nome: 'Esforço máximo',       pct_min: 110, pct_max: 120, bpm_min: '', bpm_max: '' },
];

export default function CardioPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const supabase = createClient();
  const [aval, setAval] = useState<any>(null);
  const [idade, setIdade] = useState<number | null>(null);

  // Campos básicos
  const [form, setForm] = useState({
    protocolo: 'Esteira', vo2max: '', l2: '', vam: '', fc_max: '', fc_repouso: '',
    fc_limiar: '', carga_limiar: '', carga_max: '', ve_max: '',
    ponto_limiar_tempo: '', classificacao_vo2: '',
  });

  // Recuperação FC por segundo
  const [recFC, setRecFC] = useState<Record<number, string>>(
    Object.fromEntries(REC_SEGUNDOS.map(s => [s, '']))
  );

  // Zonas por % (60–115%)
  const [zonasPct, setZonasPct] = useState<Record<number, string>>(
    Object.fromEntries(INTENSIDADES.map(i => [i, '']))
  );

  // Velocidades por intensidade (60–100%)
  const [velTreino, setVelTreino] = useState<Record<number, { velocidade: string; pace: string }>>(
    Object.fromEntries(INTENS_VEL.map(i => [i, { velocidade: '', pace: '' }]))
  );

  // Zonas por limiar (FitCheck)
  const [zonasLimiar, setZonasLimiar] = useState(ZONAS_LIMIAR_DEFAULT);

  const upd = (k: string) => (e: any) => setForm(f => ({ ...f, [k]: e.target.value }));

  useEffect(() => { (async () => {
    const { data: av } = await supabase.from('avaliacoes').select('*, pacientes(*)').eq('id', params.id).single();
    setAval(av);
    setIdade(calcIdade(av.pacientes.data_nascimento));

    const d = await buscarModulo('cardiorrespiratorio', params.id);
    if (d) {
      setForm(f => ({
        ...f,
        protocolo: d.protocolo ?? 'Esteira',
        vo2max:    d.vo2max?.toString() ?? '',
        l2:        d.l2?.toString() ?? '',
        vam:       d.vam?.toString() ?? '',
        fc_max:    d.fc_max?.toString() ?? '',
        fc_repouso: d.fc_repouso?.toString() ?? '',
        fc_limiar:  d.fc_limiar?.toString() ?? '',
        carga_limiar: d.carga_limiar?.toString() ?? '',
        carga_max:  d.carga_max?.toString() ?? '',
        ve_max:     d.ve_max?.toString() ?? '',
        ponto_limiar_tempo: d.ponto_limiar_tempo ?? '',
        classificacao_vo2: d.classificacao_vo2 ?? '',
      }));
      if (d.rec_fc && Object.keys(d.rec_fc).length) {
        setRecFC(Object.fromEntries(REC_SEGUNDOS.map(s => [s, d.rec_fc[s]?.toString() ?? ''])));
      }
      if (Array.isArray(d.zonas_percentual) && d.zonas_percentual.length) {
        const map = Object.fromEntries(d.zonas_percentual.map((z: any) => [z.pct, z.bpm?.toString() ?? '']));
        setZonasPct(z => ({ ...z, ...map }));
      }
      if (Array.isArray(d.velocidades_treino) && d.velocidades_treino.length) {
        const map = Object.fromEntries(d.velocidades_treino.map((v: any) => [v.intensidade, { velocidade: v.velocidade?.toString() ?? '', pace: v.pace ?? '' }]));
        setVelTreino(v => ({ ...v, ...map }));
      }
      if (Array.isArray(d.zonas_limiar) && d.zonas_limiar.length) {
        setZonasLimiar(d.zonas_limiar.map((z: any) => ({ ...z, bpm_min: z.bpm_min?.toString() ?? '', bpm_max: z.bpm_max?.toString() ?? '' })));
      }
    }
  })(); }, [params.id, supabase]);

  const num = (v: string) => v !== '' ? parseFloat(v) : null;
  const fcMaxUsada = Number(form.fc_max) || (idade ? fcMaxTanaka(idade) : null);
  const zonasCalc = useMemo(() => fcMaxUsada ? zonasTreinamento(fcMaxUsada) : null, [fcMaxUsada]);
  const classificacao = useMemo(() => {
    const v = Number(form.vo2max); const pac = aval?.pacientes;
    if (!v || !pac) return '';
    return classificaVO2(v, pac.sexo, calcIdade(pac.data_nascimento));
  }, [form.vo2max, aval]);

  const autoSaveValue = { form, recFC, zonasPct, velTreino, zonasLimiar, zonasCalc, classificacao };

  const salvar = async (v = autoSaveValue) => {
    const zonas_percentual = INTENSIDADES.filter(i => v.zonasPct[i]).map(i => ({ pct: i, bpm: num(v.zonasPct[i]) }));
    const velocidades_treino = INTENS_VEL.filter(i => v.velTreino[i]?.velocidade).map(i => ({
      intensidade: i, velocidade: num(v.velTreino[i].velocidade), pace: v.velTreino[i].pace || null
    }));
    const rec_fc = Object.fromEntries(REC_SEGUNDOS.filter(s => v.recFC[s]).map(s => [s, num(v.recFC[s])]));
    const zonas_limiar = v.zonasLimiar.filter(z => z.bpm_min || z.bpm_max).map(z => ({
      ...z, bpm_min: num(String(z.bpm_min)), bpm_max: num(String(z.bpm_max))
    }));

    // Calcular zonas Z1-Z5 para compatibilidade
    const zonas = v.zonasCalc;

    return upsertModulo('cardiorrespiratorio', params.id, {
      protocolo: v.form.protocolo || null,
      vo2max: num(v.form.vo2max), l2: num(v.form.l2), vam: num(v.form.vam),
      fc_max: num(v.form.fc_max), fc_repouso: num(v.form.fc_repouso),
      fc_limiar: num(v.form.fc_limiar), carga_limiar: num(v.form.carga_limiar),
      carga_max: num(v.form.carga_max), ve_max: num(v.form.ve_max),
      ponto_limiar_tempo: v.form.ponto_limiar_tempo || null,
      classificacao_vo2: v.form.classificacao_vo2 || v.classificacao || null,
      zonas, rec_fc, zonas_percentual, velocidades_treino, zonas_limiar,
    });
  };

  const saving = useAutoSave(autoSaveValue, salvar, 2000);

  if (!aval) return <p className="text-slate-500">Carregando…</p>;
  const steps = buildSteps(params.id, aval.modulos_selecionados);

  return (
    <div>
      <div className="max-w-4xl space-y-5 mt-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">Cardiorrespiratório / Ventilometria</h2>
          <SaveIndicator state={saving} />
        </div>

        {/* Dados principais */}
        <Card>
          <CardHeader><CardTitle>Dados principais</CardTitle></CardHeader>
          <CardBody>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Field label="Protocolo">
                <Select value={form.protocolo} onChange={upd('protocolo')}>
                  <option>Esteira</option>
                  <option>Bike</option>
                  <option>Remo</option>
                  <option>Outro</option>
                </Select>
              </Field>
              <Field label="VO₂máx (ml/kg/min)">
                <Input type="number" step="0.01" value={form.vo2max} onChange={upd('vo2max')} />
              </Field>
              <Field label="FC Limiar (bpm)">
                <Input type="number" step="0.1" value={form.fc_limiar} onChange={upd('fc_limiar')} />
              </Field>
              <Field label="FC Máx (bpm)">
                <Input type="number" value={form.fc_max}
                  placeholder={fcMaxUsada ? `Tanaka: ${fcMaxUsada}` : ''}
                  onChange={upd('fc_max')} />
              </Field>
              <Field label="FC Repouso (bpm)">
                <Input type="number" value={form.fc_repouso} onChange={upd('fc_repouso')} />
              </Field>
              <Field label="VAM (km/h)">
                <Input type="number" step="0.1" value={form.vam} onChange={upd('vam')} />
              </Field>
              <Field label="L2 / Limiar (km/h)">
                <Input type="number" step="0.1" value={form.l2} onChange={upd('l2')} />
              </Field>
              <Field label="VE Máx (l/min)">
                <Input type="number" step="0.1" value={form.ve_max} onChange={upd('ve_max')} />
              </Field>
              <Field label="Carga limiar (km/h)">
                <Input type="number" step="0.1" value={form.carga_limiar} onChange={upd('carga_limiar')} />
              </Field>
              <Field label="Carga máx (km/h)">
                <Input type="number" step="0.1" value={form.carga_max} onChange={upd('carga_max')} />
              </Field>
              <Field label="Ponto de limiar (tempo)">
                <Input type="text" placeholder="06:25" value={form.ponto_limiar_tempo} onChange={upd('ponto_limiar_tempo')} />
              </Field>
              <Field label="Classificação VO₂">
                <Input type="text" placeholder={classificacao || 'ex: Razoável'} value={form.classificacao_vo2} onChange={upd('classificacao_vo2')} />
              </Field>
            </div>
          </CardBody>
        </Card>

        {/* Recuperação FC */}
        <Card>
          <CardHeader><CardTitle>Recuperação da frequência cardíaca</CardTitle></CardHeader>
          <CardBody>
            <p className="text-xs text-slate-500 mb-3">Queda em bpm após o fim do esforço (valores negativos)</p>
            <div className="overflow-x-auto">
              <table className="text-sm w-full">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left px-2 py-2 text-slate-600">Segundos</th>
                    {REC_SEGUNDOS.map(s => <th key={s} className="text-center px-2 py-2 text-slate-600 min-w-[58px]">{s}s</th>)}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-2 py-1.5 text-slate-600 font-medium">Rec. FC (bpm)</td>
                    {REC_SEGUNDOS.map(s => (
                      <td key={s} className="px-1 py-1">
                        <Input type="number" className="text-center text-xs w-14"
                          value={recFC[s]} onChange={e => setRecFC(r => ({ ...r, [s]: e.target.value }))} />
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
            {recFC[60] && (
              <div className={`mt-3 text-sm font-medium ${Number(recFC[60]) <= -20 ? 'text-emerald-600' : Number(recFC[60]) <= -12 ? 'text-amber-600' : 'text-red-600'}`}>
                Rec. 60s: {recFC[60]} bpm — {Number(recFC[60]) <= -20 ? '✅ Boa recuperação' : Number(recFC[60]) <= -12 ? '⚠️ Recuperação mediana' : '⚠️ Recuperação ruim'}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Zonas por % */}
        <Card>
          <CardHeader><CardTitle>Zonas de treino por intensidade (%FCmáx)</CardTitle></CardHeader>
          <CardBody>
            <div className="overflow-x-auto">
              <table className="text-sm w-full">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left px-2 py-2 text-slate-600">Estágio (%)</th>
                    {INTENSIDADES.map(i => <th key={i} className="text-center px-2 py-2 text-slate-600 min-w-[58px]">{i}%</th>)}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-2 py-1.5 text-slate-600 font-medium">BPM</td>
                    {INTENSIDADES.map(i => (
                      <td key={i} className="px-1 py-1">
                        <Input type="number" className="text-center text-xs w-14"
                          value={zonasPct[i]}
                          placeholder={zonasCalc ? String(Math.round(fcMaxUsada! * i / 100)) : ''}
                          onChange={e => setZonasPct(z => ({ ...z, [i]: e.target.value }))} />
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
            {zonasCalc && !Object.values(zonasPct).some(v => v) && (
              <p className="text-xs text-slate-400 mt-2">Calculado automaticamente pela FCmáx. Preencha manualmente se tiver os valores do teste.</p>
            )}
          </CardBody>
        </Card>

        {/* Velocidades para treino */}
        <Card>
          <CardHeader><CardTitle>Velocidade para treinos por intensidade</CardTitle></CardHeader>
          <CardBody>
            <div className="overflow-x-auto">
              <table className="text-sm w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left px-3 py-2 text-slate-600">Intensidade</th>
                    {INTENS_VEL.map(i => <th key={i} className="text-center px-2 py-2 text-slate-600">{i}%</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="px-3 py-1.5 font-medium text-slate-600">km/h</td>
                    {INTENS_VEL.map(i => (
                      <td key={i} className="px-1 py-1">
                        <Input type="number" step="0.01" className="text-center text-xs w-16"
                          value={velTreino[i]?.velocidade ?? ''}
                          onChange={e => setVelTreino(v => ({ ...v, [i]: { ...v[i], velocidade: e.target.value } }))} />
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-3 py-1.5 font-medium text-slate-600">PACE (mm:ss)</td>
                    {INTENS_VEL.map(i => (
                      <td key={i} className="px-1 py-1">
                        <Input type="text" placeholder="06:30" className="text-center text-xs w-16"
                          value={velTreino[i]?.pace ?? ''}
                          onChange={e => setVelTreino(v => ({ ...v, [i]: { ...v[i], pace: e.target.value } }))} />
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>

        {/* Zonas por limiar FitCheck */}
        <Card>
          <CardHeader><CardTitle>Zonas por ponto de limiar</CardTitle></CardHeader>
          <CardBody className="space-y-2">
            <p className="text-xs text-slate-500 mb-3">Zonas em função do limiar ventilatório (não do FCmáx)</p>
            {zonasLimiar.map((z, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-end p-3 rounded-lg bg-slate-50">
                <div className="col-span-5">
                  <div className="text-xs text-slate-500 mb-1">Zona</div>
                  <Input value={z.nome}
                    onChange={e => setZonasLimiar(zs => zs.map((x, j) => j === i ? { ...x, nome: e.target.value } : x))} />
                </div>
                <div className="col-span-2">
                  <div className="text-xs text-slate-500 mb-1">% mín</div>
                  <Input type="number" value={z.pct_min}
                    onChange={e => setZonasLimiar(zs => zs.map((x, j) => j === i ? { ...x, pct_min: Number(e.target.value) } : x))} />
                </div>
                <div className="col-span-2">
                  <div className="text-xs text-slate-500 mb-1">% máx</div>
                  <Input type="number" value={z.pct_max}
                    onChange={e => setZonasLimiar(zs => zs.map((x, j) => j === i ? { ...x, pct_max: Number(e.target.value) } : x))} />
                </div>
                <div className="col-span-1">
                  <div className="text-xs text-slate-500 mb-1">BPM mín</div>
                  <Input type="number" value={String(z.bpm_min)}
                    onChange={e => setZonasLimiar(zs => zs.map((x, j) => j === i ? { ...x, bpm_min: e.target.value } : x))} />
                </div>
                <div className="col-span-1">
                  <div className="text-xs text-slate-500 mb-1">BPM máx</div>
                  <Input type="number" value={String(z.bpm_max)}
                    onChange={e => setZonasLimiar(zs => zs.map((x, j) => j === i ? { ...x, bpm_max: e.target.value } : x))} />
                </div>
                <div className="col-span-1 flex justify-end">
                  <Button size="sm" variant="ghost" onClick={() => setZonasLimiar(zs => zs.filter((_, j) => j !== i))}>
                    <Trash2 className="w-3 h-3 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
            <Button size="sm" variant="secondary" onClick={() => setZonasLimiar(zs => [...zs, { nome: '', pct_min: 0, pct_max: 0, bpm_min: '', bpm_max: '' }])}>
              <Plus className="w-3 h-3" /> Adicionar zona
            </Button>
          </CardBody>
        </Card>

        <div className="flex justify-end">
          <Button onClick={async () => {
            try {
              await salvar();
            } catch (error: any) {
              alert(error?.message ?? 'Nao foi possivel salvar o modulo cardiorrespiratorio.');
              return;
            }
            const next = steps.find(s => s.key === 'biomecanica');
            router.push(next?.href ?? `/avaliacoes/${params.id}/revisao`);
          }}>
            Continuar →
          </Button>
        </div>
      </div>
    </div>
  );
}
