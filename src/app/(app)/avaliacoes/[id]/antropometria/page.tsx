'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Field, Input, Label, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { SaveIndicator } from '@/components/ui/SaveIndicator';
import { useAutoSave } from '@/lib/useAutoSave';
import { upsertModulo, buscarModulo } from '@/lib/modulos';
import { createClient } from '@/lib/supabase/client';
import {
  calcIdade, imc, mediaDobra, percentualGorduraJP7,
  massaMagra, massaOsseaVonDobeln, somatotipoHeathCarter, rcq, calcFFMI
} from '@/lib/calculations/antropometria';
import { AlertTriangle } from 'lucide-react';
import { buildSteps } from '@/lib/steps';

const DOBRAS = [
  ['triceps', 'Tríceps'], ['subescapular', 'Subescapular'],
  ['peitoral', 'Peitoral'], ['axilar_media', 'Axilar média'],
  ['supra_iliaca', 'Supra-ilíaca'], ['abdominal', 'Abdominal'],
  ['coxa', 'Coxa'],
] as const;

const CIRC: [string, string][] = [
  ['pescoco', 'Pescoço'], ['ombro', 'Ombro'],
  ['torax', 'Tórax'],
  ['braco_dir_relaxado', 'Braço D relaxado'], ['braco_dir_contraido', 'Braço D contraído'],
  ['braco_esq_relaxado', 'Braço E relaxado'], ['braco_esq_contraido', 'Braço E contraído'],
  ['antebraco_dir', 'Antebraço D'], ['antebraco_esq', 'Antebraço E'],
  ['cintura', 'Cintura'], ['abdome', 'Abdome'], ['quadril', 'Quadril'],
  ['coxa_dir_proximal', 'Coxa D proximal'], ['coxa_dir_medial', 'Coxa D medial'],
  ['coxa_esq_proximal', 'Coxa E proximal'], ['coxa_esq_medial', 'Coxa E medial'],
  ['panturrilha_dir', 'Panturrilha D'], ['panturrilha_esq', 'Panturrilha E'],
];
const CIRC_MAP: Record<string,string> = Object.fromEntries(CIRC);

const DIAM = [
  ['umero', 'Úmero'], ['femur', 'Fêmur'],
  ['biacromial', 'Biacromial'], ['biiliocristal', 'Bi-ilíaco'],
] as const;

function emptyDobra() { return { m1: null, m2: null, m3: null, media: null }; }

export default function AntropometriaPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const supabase = createClient();
  const [aval, setAval] = useState<any>(null);
  const [pac, setPac] = useState<{ sexo: 'M' | 'F'; data_nascimento: string } | null>(null);
  const [loaded, setLoaded] = useState(false);

  const [form, setForm] = useState<any>({
    peso: '', estatura: '',
    dobras: Object.fromEntries(DOBRAS.map(([k]) => [k, emptyDobra()])),
    circunferencias: {}, diametros: {},
  });

  useEffect(() => { (async () => {
    const { data: aval } = await supabase.from('avaliacoes')
      .select('modulos_selecionados,pacientes(sexo,data_nascimento)').eq('id', params.id).single();
    setAval(aval);
    if (aval?.pacientes) setPac(aval.pacientes as any);
    const d = await buscarModulo('antropometria', params.id);
    if (d) setForm((p: any) => ({ ...p, ...d,
      dobras: { ...p.dobras, ...(d.dobras || {}) },
      circunferencias: d.circunferencias || {},
      diametros: d.diametros || {},
    }));
    setLoaded(true);
  })(); }, [params.id, supabase]);

  // Recalcula médias e resultados
  const calculados = useMemo(() => {
    if (!pac) return null;
    const idade = calcIdade(pac.data_nascimento);
    const peso = Number(form.peso) || 0;
    const est = Number(form.estatura) || 0;
    if (!peso || !est) return null;

    // médias + flags
    const dobrasCalc: any = {};
    let algumaDivergente = false;
    for (const [k] of DOBRAS) {
      const d = form.dobras[k] ?? emptyDobra();
      const r = mediaDobra(d.m1, d.m2, d.m3);
      dobrasCalc[k] = { ...d, media: r.media };
      if (r.precisaTerceira && d.m3 == null) algumaDivergente = true;
    }

    const imcVal = imc(peso, est);
    const pctG = percentualGorduraJP7(dobrasCalc, pac.sexo, idade);
    const mm = pctG != null ? massaMagra(peso, pctG) : null;
    const mo = massaOsseaVonDobeln(est, form.diametros?.umero, form.diametros?.femur);
    const rcqVal = rcq(form.circunferencias?.cintura, form.circunferencias?.quadril);
    const mediaDisponivel = (...vals: any[]) => {
      const nums = vals.map(Number).filter(v => Number.isFinite(v) && v > 0);
      return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
    };
    const bracoContraido = mediaDisponivel(
      form.circunferencias?.braco_dir_contraido,
      form.circunferencias?.braco_esq_contraido,
      form.circunferencias?.braco_contraido
    );
    const panturrilha = mediaDisponivel(
      form.circunferencias?.panturrilha_dir,
      form.circunferencias?.panturrilha_esq,
      form.circunferencias?.panturrilha
    );

    let somato = null;
    if (dobrasCalc.triceps.media && dobrasCalc.subescapular.media && dobrasCalc.supra_iliaca.media &&
        form.diametros?.umero && form.diametros?.femur &&
        bracoContraido && panturrilha) {
      somato = somatotipoHeathCarter({
        estaturaCm: est, pesoKg: peso,
        dobras: {
          triceps: dobrasCalc.triceps.media,
          subescapular: dobrasCalc.subescapular.media,
          supra_iliaca: dobrasCalc.supra_iliaca.media,
        },
        diametros: { umero: form.diametros.umero, femur: form.diametros.femur },
        circunferencias: {
          bracoContraidoCm: bracoContraido,
          panturrilhaCm: panturrilha,
        },
      });
    }

    const ffmiVal = pctG != null ? calcFFMI(peso, est, pctG) : null;
    return { idade, imcVal, pctG, mm, mo, rcqVal, somato, dobrasCalc, algumaDivergente, ffmiVal };
  }, [form, pac]);

  const saveState = useAutoSave(form, async v => {
    if (!loaded || !calculados) return;
    await upsertModulo('antropometria', params.id, {
      peso: Number(v.peso) || null,
      estatura: Number(v.estatura) || null,
      dobras: calculados.dobrasCalc,
      circunferencias: v.circunferencias,
      diametros: v.diametros,
      imc: calculados.imcVal,
      percentual_gordura: calculados.pctG,
      massa_magra: calculados.mm,
      massa_ossea: calculados.mo,
      somatotipo: calculados.somato,
      rcq: calculados.rcqVal ?? null,
      ffmi: calculados.ffmiVal ?? null,
    });
  });

  const setDobra = (k: string, field: 'm1' | 'm2' | 'm3', val: string) => {
    setForm((f: any) => ({
      ...f,
      dobras: { ...f.dobras, [k]: { ...f.dobras[k], [field]: val === '' ? null : Number(val) } }
    }));
  };

  const setCirc = (k: string, val: string) =>
    setForm((f: any) => ({ ...f, circunferencias: { ...f.circunferencias, [k]: val === '' ? undefined : Number(val) } }));
  const setDiam = (k: string, val: string) =>
    setForm((f: any) => ({ ...f, diametros: { ...f.diametros, [k]: val === '' ? undefined : Number(val) } }));
  const steps = aval ? buildSteps(params.id, aval.modulos_selecionados) : [];
  const prevStep = steps.find(s => s.key === 'bioimpedancia')
    ?? steps.find(s => s.key === 'posturografia')
    ?? steps.find(s => s.key === 'sinais_vitais')
    ?? steps.find(s => s.key === 'anamnese');
  const nextStep = steps.find(s => s.key === 'flexibilidade')
    ?? steps.find(s => s.key === 'forca')
    ?? steps.find(s => s.key === 'rml')
    ?? steps.find(s => s.key === 'cardiorrespiratorio')
    ?? steps.find(s => s.key === 'revisao');

  return (
    <div className="space-y-5 max-w-5xl">
      <Card>
        <CardHeader><CardTitle>Medidas básicas</CardTitle></CardHeader>
        <CardBody className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Field label="Peso (kg)"><Input type="number" step="0.1" value={form.peso ?? ''} onChange={e => setForm((f: any) => ({ ...f, peso: e.target.value }))} /></Field>
          <Field label="Estatura (cm)"><Input type="number" step="0.1" value={form.estatura ?? ''} onChange={e => setForm((f: any) => ({ ...f, estatura: e.target.value }))} /></Field>
          {calculados && <>
            <Field label="IMC"><Input disabled value={calculados.imcVal || ''} /></Field>
            <Field label="Idade"><Input disabled value={calculados.idade} /></Field>
          </>}
        </CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle>Dobras cutâneas (mm) — protocolo ISAK 7 pontos</CardTitle></CardHeader>
        <CardBody>
          <p className="text-xs text-slate-500 mb-3">
            2 medidas obrigatórias. Se a diferença entre elas for &gt; 5%, uma 3ª medida é exigida; usa-se a mediana.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 border-b">
                  <th className="py-2 pr-4">Dobra</th>
                  <th className="py-2 px-2">M1</th>
                  <th className="py-2 px-2">M2</th>
                  <th className="py-2 px-2">M3</th>
                  <th className="py-2 px-2">Média</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {DOBRAS.map(([k, label]) => {
                  const d = form.dobras[k] ?? emptyDobra();
                  const r = mediaDobra(d.m1, d.m2, d.m3);
                  const needThird = r.precisaTerceira && d.m3 == null;
                  return (
                    <tr key={k} className="border-b border-slate-50">
                      <td className="py-2 pr-4 font-medium">{label}</td>
                      {(['m1', 'm2', 'm3'] as const).map(f => (
                        <td key={f} className="py-1 px-1">
                          <Input type="number" step="0.1" className="h-8"
                            value={d[f] ?? ''}
                            onChange={e => setDobra(k, f, e.target.value)} />
                        </td>
                      ))}
                      <td className="py-1 px-1">
                        <Input disabled className="h-8 bg-slate-50" value={r.media ?? ''} />
                      </td>
                      <td className="py-1 pl-2">
                        {needThird && (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                            <AlertTriangle className="w-3 h-3" /> 3ª medida
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle>Circunferências (cm)</CardTitle></CardHeader>
        <CardBody className="space-y-5">
          {/* Tronco/pescoço */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Tronco e pescoço</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(['pescoco','ombro','torax','cintura','abdome','quadril'] as const).map(k => {
                const label = CIRC_MAP[k] ?? k;
                return (
                  <Field key={k} label={label}>
                    <Input type="number" step="0.1" value={form.circunferencias?.[k] ?? ''} onChange={e => setCirc(k, e.target.value)} />
                  </Field>
                );
              })}
            </div>
          </div>
          {/* Membros superiores */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Membros superiores</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {(['braco_dir_relaxado','braco_esq_relaxado','braco_dir_contraido','braco_esq_contraido','antebraco_dir','antebraco_esq'] as const).map(k => {
                const label = CIRC_MAP[k] ?? k;
                return (
                  <Field key={k} label={label}>
                    <Input type="number" step="0.1" value={form.circunferencias?.[k] ?? ''} onChange={e => setCirc(k, e.target.value)} />
                  </Field>
                );
              })}
            </div>
          </div>
          {/* Membros inferiores */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Membros inferiores</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(['coxa_dir_proximal','coxa_esq_proximal','coxa_dir_medial','coxa_esq_medial','panturrilha_dir','panturrilha_esq'] as const).map(k => {
                const label = CIRC_MAP[k] ?? k;
                return (
                  <Field key={k} label={label}>
                    <Input type="number" step="0.1" value={form.circunferencias?.[k] ?? ''} onChange={e => setCirc(k, e.target.value)} />
                  </Field>
                );
              })}
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle>Diâmetros ósseos (cm)</CardTitle></CardHeader>
        <CardBody className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {DIAM.map(([k, label]) => (
            <Field key={k} label={label}>
              <Input type="number" step="0.1" value={form.diametros?.[k] ?? ''} onChange={e => setDiam(k, e.target.value)} />
            </Field>
          ))}
        </CardBody>
      </Card>

      {calculados && (
        <Card>
          <CardHeader><CardTitle>Resultados calculados</CardTitle></CardHeader>
          <CardBody className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Result label="% Gordura" value={calculados.pctG != null ? `${calculados.pctG}%` : '—'} />
            <Result label="Massa magra" value={calculados.mm != null ? `${calculados.mm} kg` : '—'} />
            <Result label="Massa óssea" value={calculados.mo != null ? `${calculados.mo} kg` : '—'} />
            <Result label="RCQ" value={calculados.rcqVal ?? '—'} />
            {calculados.somato && <>
              <Result label="Endomorfia" value={calculados.somato.endomorfia} />
              <Result label="Mesomorfia" value={calculados.somato.mesomorfia} />
              <Result label="Ectomorfia" value={calculados.somato.ectomorfia} />
              <Result label="Classificação" value={calculados.somato.classificacao} />
            </>}
          </CardBody>
        </Card>
      )}

      <div className="flex justify-between">
        <Button variant="secondary" onClick={() => router.push(prevStep?.href ?? `/avaliacoes/${params.id}/posturografia`)}>← Voltar</Button>
        <Button onClick={() => router.push(nextStep?.href ?? `/avaliacoes/${params.id}/revisao`)}>Continuar →</Button>
      </div>
      <SaveIndicator state={saveState} />
    </div>
  );
}

function Result({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-lg font-semibold text-slate-800 mt-0.5">{value}</div>
    </div>
  );
}
