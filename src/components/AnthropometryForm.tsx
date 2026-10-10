'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Save, Plus, Trash2, AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select, Textarea } from '@/components/ui/Input';
import { createClient } from '@/lib/supabase/client';
import { buildSteps } from '@/lib/steps';
import { ENGINE_VERSION, MEASUREMENTS, METHODS, newAnthropometry, anthropometrySchema, calculateAnthropometry } from '@/lib/anthropometry';
import AnthropometryResults, { anthropometryFormat, anthropometryDate, type AnthropometryResult, type AnthropometryHistoryEntry } from './AnthropometryResults';

type InputData = ReturnType<typeof newAnthropometry>;
type Context = Parameters<typeof calculateAnthropometry>[1];
type MeasurementId = keyof InputData['measurements'];
export type AnthropometryStoredRow = { registro_v2: unknown; resultados_v2: AnthropometryResult | null; revision_v2: number | null };
const statusLabels = { available: 'Consolidada', missing: 'Faltam leituras', review: 'Calculada com ressalva', invalid: 'Invalida' };
const consolidationLabels = { none: 'Sem valor', single: 'Leitura unica', mean: 'Media', median: 'Mediana' };
const groupLabels = { basic: 'Medidas basicas', skinfold: 'Dobras cutaneas', girth: 'Perimetros', breadth: 'Diametros osseos' };
const methodsById = new Map(METHODS.map(method => [method.id, method]));
const methodGroups = [
  { id: 'muscle', title: 'Massa muscular', description: 'Estimativas antropometricas de massa muscular.', methods: ['martin1990', 'lee2000', 'kerrMuscle1988'] },
  { id: 'adipose', title: 'Massa adiposa anatomica', description: 'Componente anatomico de Kerr; nao equivale ao percentual de gordura quimica.', methods: ['kerrAdipose1988'] },
  { id: 'bone', title: 'Massa ossea estimada', description: 'Estimativas antropometricas; nao equivalem a densitometria ou conteudo mineral por DXA.', methods: ['martinBone1991', 'rocha1975'] },
  { id: 'shape', title: 'Somatotipo e proporcionalidade', description: 'Descricao morfologica e proporcional; nao representa diagnostico ou ideal corporal.', methods: ['heathCarter', 'phantom'] },
  { id: 'general', title: 'Medidas e indices gerais', description: 'Medidas consolidadas, indices geometricos e classificacoes dependentes de aplicabilidade.', methods: ['direct', 'indices', 'bmiWHO', 'dubois1916'] },
  { id: 'maturity', title: 'Maturacao', description: 'Estimativa aplicavel somente a faixa etaria e contexto previstos pelo metodo.', methods: ['mirwald2002'] },
  { id: 'energy', title: 'Energia e cenarios profissionais', description: 'Estimativa energetica historica e cenarios opcionais definidos pelo avaliador.', methods: ['harrisBenedict1919', 'scenarios'] },
] as const;

function DecimalInput({ value, onChange, onInvalid, label, ...props }: {
  value: number | null; onChange: (value: number | null) => void; onInvalid: (invalid: boolean) => void; label: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'onInvalid'>) {
  const [text, setText] = useState(value == null ? '' : String(value).replace('.', ','));
  const [invalid, setInvalid] = useState(false);
  useEffect(() => { setText(value == null ? '' : String(value).replace('.', ',')); }, [value]);
  return <Input {...props} type="text" inputMode="decimal" aria-label={label} aria-invalid={invalid || undefined} value={text} onChange={event => {
    const next = event.target.value;
    setText(next);
    const trimmed = next.trim();
    const valid = trimmed === '' || (/^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)$/.test(trimmed) && Number.isFinite(Number(trimmed.replace(',', '.'))));
    setInvalid(!valid); onInvalid(!valid);
    if (valid) onChange(trimmed === '' ? null : Number(trimmed.replace(',', '.')));
  }} />;
}

export default function AnthropometryForm({ avaliacaoId, initialRow }: { avaliacaoId: string; initialRow: AnthropometryStoredRow | null }) {
  const sb = useMemo(() => createClient(), []);
  const router = useRouter();
  const [input, setInput] = useState<InputData>(newAnthropometry);
  const [context, setContext] = useState<Context | null>(null);
  const [modules, setModules] = useState<any>({});
  const [revision, setRevision] = useState<number | null>(initialRow?.revision_v2 ?? null);
  const [storedResults, setStoredResults] = useState<AnthropometryResult | null>(null);
  const [needsRecalculation, setNeedsRecalculation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [historyError, setHistoryError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [history, setHistory] = useState<AnthropometryHistoryEntry[]>([]);
  const [selectedHistory, setSelectedHistory] = useState<string[]>([]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const saveLock = useRef(false);
  const [message, setMessage] = useState('');
  const [saveError, setSaveError] = useState('');
  const [invalidFields, setInvalidFields] = useState<Record<string, boolean>>({});
  const [tab, setTab] = useState<'collection' | 'results' | 'interpretation'>('collection');
  const [selectedOnly, setSelectedOnly] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true); setLoadError(''); setHistoryError('');
    (async () => {
      try {
        const parsed = initialRow ? anthropometrySchema.parse(initialRow.registro_v2) : newAnthropometry();
        if (initialRow && (!Number.isInteger(initialRow.revision_v2) || initialRow.revision_v2! < 1)) throw new Error('Revisao do registro V2 ausente ou invalida. Nenhum dado foi alterado.');
        const { data: av, error } = await sb.from('avaliacoes').select('id,data,paciente_id,modulos_selecionados,pacientes(data_nascimento,sexo)').eq('id', avaliacaoId).single();
        if (error || !av) throw new Error(error?.message ?? 'Avaliacao nao encontrada.');
        const patient = Array.isArray(av.pacientes) ? av.pacientes[0] : av.pacientes;
        if (!patient?.data_nascimento || !['M', 'F'].includes(patient.sexo) || !av.data) throw new Error('Confira data da avaliacao, nascimento e sexo no cadastro. Os dados nao serao inferidos.');
        if (!active) return;
        const staleSnapshot = !!initialRow?.resultados_v2 && initialRow.resultados_v2.engineVersion !== ENGINE_VERSION;
        setInput(parsed); setContext({ date: av.data, birthDate: patient.data_nascimento, sex: patient.sexo as 'M' | 'F' });
        setModules(av.modulos_selecionados ?? {});
        setStoredResults(initialRow?.resultados_v2 ?? null); setNeedsRecalculation(staleSnapshot); setDirty(staleSnapshot); setLoading(false);
        const { data: past, error: pastError } = await sb.from('avaliacoes').select('id,data,antropometria(*)').eq('paciente_id', av.paciente_id).order('data');
        if (!active) return;
        if (pastError) { setHistoryError('Nao foi possivel carregar o historico. A coleta atual permanece disponivel.'); return; }
        const entries: AnthropometryHistoryEntry[] = [];
        for (const assessment of past ?? []) {
          if (assessment.id === avaliacaoId) continue;
          const row = Array.isArray(assessment.antropometria) ? assessment.antropometria[0] : assessment.antropometria;
          if (row?.registro_v2?.version === 2 && row?.resultados_v2?.version === 2 && Array.isArray(row.resultados_v2.results)) entries.push({ id: assessment.id, date: assessment.data, results: row.resultados_v2 });
        }
        setHistory(entries); setSelectedHistory(entries.map(item => item.id));
      } catch (error) {
        if (active) { setLoadError(error instanceof Error ? error.message : 'Nao foi possivel carregar a antropometria.'); setLoading(false); }
      }
    })();
    return () => { active = false; };
  }, [avaliacaoId, initialRow, sb, attempt]);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (dirty || saving) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty, saving]);

  const calculated = useMemo(() => {
    if (!context || loading || loadError) return { result: null, error: '' };
    try { return { result: !dirty && !needsRecalculation && storedResults ? storedResults : calculateAnthropometry(input, context), error: '' }; }
    catch (error) { return { result: null, error: error instanceof Error ? error.message : 'Nao foi possivel calcular os resultados.' }; }
  }, [input, context, dirty, needsRecalculation, storedResults, loading, loadError]);

  function change(patch: Partial<InputData>) { setInput(current => ({ ...current, ...patch })); setDirty(true); setMessage(''); setSaveError(''); }
  function markInvalid(key: string, invalid: boolean) { setInvalidFields(current => ({ ...current, [key]: invalid })); setDirty(true); setMessage(''); }
  function updateMeasurement(id: MeasurementId, patch: Partial<InputData['measurements'][MeasurementId]>) {
    setInput(current => ({ ...current, measurements: { ...current.measurements, [id]: { ...current.measurements[id], ...patch } } }));
    setDirty(true); setMessage(''); setSaveError('');
  }
  async function save() {
    if (saveLock.current || !context || loadError) return false;
    if (Object.values(invalidFields).some(Boolean)) { setSaveError('Corrija os campos com formato numerico invalido antes de salvar.'); return false; }
    saveLock.current = true; setSaving(true); setMessage(''); setSaveError('');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    try {
      const snapshot = anthropometrySchema.parse(structuredClone(input));
      const response = await fetch('/api/modulos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal,
        body: JSON.stringify({ tabela: 'antropometria', avaliacaoId, payload: { registro_v2: snapshot, expected_revision: revision } }) });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(response.status === 409 ? 'Conflito de revisao: esta avaliacao foi alterada em outra sessao. Seus campos foram preservados; recarregue e confira antes de salvar novamente.' : body?.error ?? `Falha ao salvar (${response.status}).`);
      const row = body?.data;
      if (body?.ok !== true || !row || !Number.isInteger(row.revision_v2) || row.revision_v2 <= (revision ?? 0) || row.resultados_v2?.version !== 2 || !Array.isArray(row.resultados_v2.results)) throw new Error('A API nao confirmou o registro e sua revisao. Confira a avaliacao antes de tentar novamente.');
      const persisted = anthropometrySchema.parse(row.registro_v2);
      if (JSON.stringify(persisted) !== JSON.stringify(snapshot)) throw new Error('A API retornou uma coleta diferente da enviada. Nenhuma confirmacao de sucesso foi aplicada. Recarregue para conferir.');
      setRevision(row.revision_v2); setStoredResults(row.resultados_v2); setInput(persisted); setNeedsRecalculation(false); setDirty(false); setMessage('Antropometria salva.');
      return true;
    } catch (error) {
      const networkFailure = error instanceof TypeError && /fetch|network|load/i.test(error.message);
      setSaveError(error instanceof Error && error.name === 'AbortError'
        ? 'Tempo de resposta excedido. O salvamento nao foi confirmado; confira a avaliacao antes de repetir.'
        : networkFailure
          ? 'Falha de conexao ou DNS antes de chegar ao servidor. Seus campos foram preservados. Confira a internet, recarregue a pagina pelo dominio avaliacao.medfit.med.br e tente salvar novamente.'
          : error instanceof Error ? error.message : 'Falha ao salvar. Seus campos foram preservados.');
      return false;
    } finally { clearTimeout(timeout); saveLock.current = false; setSaving(false); }
  }

  if (loading) return <p role="status">Carregando coleta V2...</p>;
  if (loadError) return <div role="alert" className="space-y-3 text-red-800"><p>{loadError}</p><Button variant="secondary" onClick={() => setAttempt(value => value + 1)}><RotateCcw size={16} />Tentar novamente</Button></div>;
  const result = calculated.result;
  const steps = buildSteps(avaliacaoId, modules);
  const currentStep = steps.findIndex(step => step.key === 'antropometria');
  const previous = steps.slice(0, currentStep).reverse().find(step => step.enabled);
  const next = steps.slice(currentStep + 1).find(step => step.enabled);
  const groups = [...new Set(MEASUREMENTS.map(measurement => measurement.group))];
  const pending = result ? Object.values(result.measurements).filter(measurement => (measurement.status === 'missing' || measurement.status === 'invalid') && !input.measurements[measurement.id].notApplicable).length : 26;
  const cautions = result ? Object.values(result.measurements).filter(measurement => measurement.status === 'review' && !input.measurements[measurement.id].notApplicable).length : 0;
  const ignored = Object.values(input.measurements).filter(measurement => measurement.notApplicable).length;
  const invalidNumber = Object.values(invalidFields).some(Boolean);
  const chosenHistory = history.filter(item => selectedHistory.includes(item.id));

  return <div className="max-w-6xl min-w-0 space-y-5 pb-10" data-anthropometry-v2>
    <header className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-semibold">Antropometria</h1><p className="mt-1 text-sm text-gray-600">{context && anthropometryDate(context.date)} · 26 medidas · {revision == null ? 'Nova coleta' : `Revisao ${revision}`}</p></div><Button onClick={save} disabled={saving || invalidNumber}><Save size={16} />{saving ? 'Salvando...' : 'Salvar rascunho'}</Button></header>
    {message && <p role="status" className="border-l-4 border-emerald-600 bg-emerald-50 p-3 text-sm text-emerald-900">{message}</p>}
    {saveError && <p role="alert" className="border-l-4 border-red-600 bg-red-50 p-3 text-sm text-red-900">{saveError}</p>}
    {needsRecalculation && <p role="status" className="border-l-4 border-amber-500 bg-amber-50 p-3 text-sm text-amber-950">Os resultados foram atualizados pelo motor antropometrico atual. Salve a coleta para atualizar revisao, painel, portal e PDF.</p>}
    {calculated.error && <p role="alert" className="text-sm text-red-800">{calculated.error}</p>}
    {invalidNumber && <p role="alert" className="text-sm text-red-800">Formato numerico invalido. Use virgula ou ponto decimal, sem separador de milhar.</p>}
    <div className="flex flex-wrap gap-1 border-b" role="tablist" aria-label="Antropometria">{([['collection', 'Coleta'], ['results', 'Resultados'], ['interpretation', 'Interpretacao']] as const).map(([key, label]) => <button key={key} type="button" role="tab" id={`anthropometry-tab-${key}`} aria-controls={`anthropometry-panel-${key}`} aria-selected={tab === key} onClick={() => setTab(key)} className={`px-4 py-3 text-sm border-b-2 ${tab === key ? 'border-teal-700 text-teal-800 font-semibold' : 'border-transparent text-gray-600'}`}>{label}</button>)}</div>
    <fieldset disabled={saving} className="min-w-0 space-y-6">
      <div role="tabpanel" id="anthropometry-panel-collection" aria-labelledby="anthropometry-tab-collection" hidden={tab !== 'collection'} className="space-y-6">
        <section className="space-y-4 border-b pb-5"><h2 className="text-lg font-semibold">Contexto da coleta</h2><div className="grid gap-4 sm:grid-cols-2">
          <Field label="Protocolo de coleta"><Input aria-label="Protocolo de coleta" value={input.collectionProtocol} onChange={event => change({ collectionProtocol: event.target.value })} /></Field>
          <Field label="Edicao do manual utilizada"><Input aria-label="Edicao do manual utilizada" value={input.manualEdition === 'unknown' ? '' : input.manualEdition} onChange={event => change({ manualEdition: event.target.value || 'unknown' })} /></Field>
          <Field label="Sexo utilizado pelas equacoes"><Input disabled value={context?.sex === 'M' ? 'Masculino, conforme cadastro' : 'Feminino, conforme cadastro'} /></Field>
          <Field label="Gestacao"><Select aria-label="Gestacao" value={input.pregnant == null ? '' : String(input.pregnant)} onChange={event => change({ pregnant: event.target.value === '' ? null : event.target.value === 'true' })}><option value="">Nao informada</option><option value="false">Nao</option><option value="true">Sim</option></Select></Field>
        </div><Field label="Condicoes e observacoes da coleta"><Textarea aria-label="Condicoes da coleta" value={input.conditions} onChange={event => change({ conditions: event.target.value })} /></Field>
          <h3 className="font-semibold text-sm">Instrumentos</h3><div className="space-y-3">{input.instruments.map((instrument, index) => <div key={index} className="grid gap-2 sm:grid-cols-[2fr_1fr_1fr_auto] items-end">
            <Field label="Instrumento"><Input aria-label={`Instrumento ${index + 1}`} value={instrument.name} onChange={event => change({ instruments: input.instruments.map((item, position) => position === index ? { ...item, name: event.target.value } : item) })} /></Field>
            <Field label="Resolucao"><DecimalInput label={`Resolucao ${index + 1}`} value={instrument.resolution} onInvalid={invalid => markInvalid(`resolution-${index}`, invalid)} onChange={value => change({ instruments: input.instruments.map((item, position) => position === index ? { ...item, resolution: value } : item) })} /></Field>
            <Field label="Unidade"><Select aria-label={`Unidade ${index + 1}`} value={instrument.unit} onChange={event => change({ instruments: input.instruments.map((item, position) => position === index ? { ...item, unit: event.target.value } : item) })}><option value="">Selecionar</option>{['kg', 'cm', 'mm'].map(unit => <option key={unit}>{unit}</option>)}</Select></Field>
            <Button variant="ghost" title="Remover instrumento" aria-label={`Remover instrumento ${index + 1}`} onClick={() => { change({ instruments: input.instruments.filter((_, position) => position !== index) }); setInvalidFields(current => Object.fromEntries(Object.entries(current).filter(([key]) => !key.startsWith('resolution-')))); }}><Trash2 size={16} /></Button>
          </div>)}</div><Button variant="secondary" onClick={() => change({ instruments: [...input.instruments, { name: '', resolution: null, unit: '' }] })}><Plus size={16} />Adicionar instrumento</Button>
        </section>
        <div className="flex items-center gap-2 text-sm text-amber-900"><AlertTriangle size={16} className="shrink-0" /><span>{pending} medidas ausentes ou invalidas{cautions ? `; ${cautions} calculada(s) com leitura unica ou outra ressalva` : ''}{ignored ? `; ${ignored} confirmada(s) como nao aplicavel(is)` : ''}. Valores parciais podem ser salvos e analisados com cautela. Lado direito do avaliado; excecoes justificadas.</span></div>
        {groups.map(group => <section key={group} className="space-y-3"><h2 className="text-lg font-semibold">{groupLabels[group]}</h2><div className="divide-y border-y">{MEASUREMENTS.filter(measurement => measurement.group === group).map(measurement => {
          const id = measurement.id as MeasurementId;
          const reading = input.measurements[id];
          const quality = result?.measurements[id];
          return <div key={id} data-measurement-id={id} className="py-4 space-y-2">
            <div className="flex flex-wrap items-baseline justify-between gap-2"><h3 className="font-medium text-sm">{measurement.label} <span className="text-gray-500">({measurement.unit})</span></h3><span className={`text-xs ${reading.notApplicable ? 'text-gray-600' : quality?.status === 'invalid' ? 'text-red-700' : quality?.status === 'available' ? 'text-emerald-800' : 'text-amber-800'}`}>{reading.notApplicable ? 'Nao aplicavel' : quality ? statusLabels[quality.status] : 'Pendente'}</span></div>
            <div className="grid grid-cols-3 sm:grid-cols-[1fr_1fr_1fr_1.2fr] gap-2">
              {[0, 1, 2].map(index => <Field key={index} label={`${index + 1}a leitura`}><DecimalInput disabled={reading.notApplicable} label={`${measurement.label} leitura ${index + 1}`} data-reading={`${id}-${index + 1}`} value={reading.readings[index]} onInvalid={invalid => markInvalid(`${id}-${index}`, invalid)} onChange={value => { const readings = [...reading.readings] as typeof reading.readings; readings[index] = value; updateMeasurement(id, { readings }); }} /></Field>)}
              <div className="col-span-3 sm:col-span-1 bg-gray-50 px-3 py-2"><div className="text-xs text-gray-500">{quality ? consolidationLabels[quality.consolidation] : 'Consolidado'}</div><output className="font-semibold text-sm" aria-label={`${measurement.label} consolidado`}>{anthropometryFormat(quality?.value)}{quality?.value != null ? ` ${measurement.unit}` : ''}</output></div>
            </div>
            {quality?.requiresThird && <p className="text-xs text-amber-800">Terceira leitura necessaria. Discrepancia: {anthropometryFormat(quality.discrepancyPercent)}%.</p>}
            {quality?.reason && <p className="text-xs text-gray-600">{quality.reason}</p>}
            <label className="flex items-center gap-2 text-sm"><input aria-label={`${measurement.label} nao aplicavel`} type="checkbox" checked={reading.notApplicable} onChange={event => updateMeasurement(id, event.target.checked ? { notApplicable: true, readings: [null, null, null] } : { notApplicable: false })} />Nao se aplica a esta avaliacao</label>
            {reading.notApplicable && <Field label="Motivo opcional"><Input aria-label={`${measurement.label} motivo nao aplicavel`} value={reading.notApplicableReason} onChange={event => updateMeasurement(id, { notApplicableReason: event.target.value })} /></Field>}
            <details><summary className="text-xs text-sky-800 cursor-pointer">Local anatomico e lado</summary><p className="text-xs text-gray-600 mt-2">{measurement.landmark}</p><div className="mt-2 grid gap-3 sm:grid-cols-[180px_1fr]"><Field label="Lado"><Select aria-label={`${measurement.label} lado`} value={reading.side} onChange={event => updateMeasurement(id, { side: event.target.value as 'D' | 'E' })}><option value="D">Direito</option><option value="E">Esquerdo (excecao)</option></Select></Field><Field label="Justificativa / observacoes"><Input aria-label={`${measurement.label} excecao`} value={reading.exception} onChange={event => updateMeasurement(id, { exception: event.target.value })} /></Field></div></details>
          </div>;
        })}</div></section>)}
      </div>
      <div role="tabpanel" id="anthropometry-panel-results" aria-labelledby="anthropometry-tab-results" hidden={tab !== 'results'} className="space-y-5">
        <section className="space-y-3" data-fat-methods>
          <h2 className="text-lg font-semibold">Percentual de gordura</h2>
          <label className="flex items-start gap-3 rounded border border-emerald-200 bg-emerald-50 p-3 text-sm">
            <input type="checkbox" className="mt-1" aria-label="Selecionar Durnin-Womersley/Rahaman + Siri" checked={input.methods.includes('siri1961')} onChange={event => change({ methods: event.target.checked
              ? [...new Set([...input.methods.filter(id => id !== 'durninWomersley1974' && id !== 'siri1961'), 'durninWomersley1974', 'siri1961'])]
              : input.methods.filter(id => id !== 'durninWomersley1974' && id !== 'siri1961') })} />
            <span><strong>Durnin-Womersley/Rahaman + Siri</strong><span className="mt-1 block text-xs text-gray-600">Calcula a densidade com biceps, triceps, subescapular e crista iliaca e a converte em percentual de gordura. A faixa etaria define automaticamente Durnin-Rahaman ou Durnin-Womersley.</span></span>
          </label>
          <div className="grid gap-3 border-t pt-3 sm:grid-cols-2">
            <label className="flex items-start gap-2 text-sm text-gray-600"><input type="checkbox" className="mt-1" checked={input.methods.includes('petroski1995')} disabled={!input.methods.includes('petroski1995')} onChange={() => change({ methods: input.methods.filter(id => id !== 'petroski1995') })} aria-label="Remover selecao antiga de Petroski" /><span><strong className="text-gray-800">Petroski</strong><span className="mt-1 block text-xs">Indisponivel neste conjunto de 26 medidas: exige local supra-iliaco especifico, sem substituicao por crista iliaca, supraespinal ou dobra abdominal.{input.methods.includes('petroski1995') ? ' Selecao antiga: desmarque para remover.' : ''}</span></span></label>
            <label className="flex items-start gap-2 text-sm text-gray-600"><input type="checkbox" className="mt-1" checked={input.methods.includes('jackson1980')} disabled={!input.methods.includes('jackson1980')} onChange={() => change({ methods: input.methods.filter(id => id !== 'jackson1980') })} aria-label="Remover selecao antiga de Jackson, Pollock e Ward" /><span><strong className="text-gray-800">Jackson, Pollock e Ward</strong><span className="mt-1 block text-xs">Indisponivel neste conjunto de 26 medidas: os locais exatos exigidos pela equacao nao foram coletados. A dobra abdominal isolada nao completa o protocolo.{input.methods.includes('jackson1980') ? ' Selecao antiga: desmarque para remover.' : ''}</span></span></label>
          </div>
        </section>
        <div className="space-y-5" data-method-groups>{methodGroups.map(group => <section key={group.id} data-method-group={group.id} className="space-y-3 border-t pt-4">
          <div><h2 className="text-lg font-semibold">{group.title}</h2><p className="mt-1 text-xs text-gray-600">{group.description}</p></div>
          <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">{group.methods.map(id => methodsById.get(id)).filter((method): method is NonNullable<typeof method> => Boolean(method)).map(method => <label key={method.id} className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1" aria-label={`Selecionar ${method.label}`} checked={input.methods.includes(method.id)} onChange={event => change({ methods: event.target.checked ? [...input.methods, method.id] : input.methods.filter(id => id !== method.id) })} /><span>{method.label}</span></label>)}</div>
          {group.id === 'muscle' && <div className="max-w-xl space-y-2 pt-1"><Field label="Categoria populacional utilizada por Lee"><Select aria-label="Categoria populacional Lee" value={input.populationCategory ?? ''} onChange={event => change({ populationCategory: (event.target.value || null) as InputData['populationCategory'] })}><option value="">Nao informada</option><option value="asian">Asiatica (categoria historica do modelo)</option><option value="africanAmerican">Afro-americana (categoria historica do modelo)</option><option value="whiteHispanic">Branca / hispanica (categoria historica do modelo)</option></Select></Field><p className="text-xs text-gray-600">Categorias historicas definem coeficientes metodologicos, nao caracteristicas deterministas da pessoa.</p></div>}
        </section>)}</div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={selectedOnly} onChange={event => setSelectedOnly(event.target.checked)} />Mostrar apenas metodos selecionados</label>
        {historyError && <p role="status" className="text-sm text-amber-800">{historyError}</p>}
        {history.length > 0 && <section className="space-y-3"><h3 className="font-semibold">Avaliacoes para comparacao</h3><div className="flex flex-wrap gap-4">{history.map(item => <label key={item.id} className="text-sm flex gap-2 items-center"><input type="checkbox" checked={selectedHistory.includes(item.id)} onChange={event => setSelectedHistory(current => event.target.checked ? [...current, item.id] : current.filter(id => id !== item.id))} />{anthropometryDate(item.date)}</label>)}</div></section>}
        {result && <AnthropometryResults results={result} selectedOnly={selectedOnly} history={chosenHistory.length ? [...chosenHistory, { id: avaliacaoId, date: context!.date, results: result }] : []} />}
      </div>
      <div role="tabpanel" id="anthropometry-panel-interpretation" aria-labelledby="anthropometry-tab-interpretation" hidden={tab !== 'interpretation'} className="space-y-5">
        <Field label="Parecer profissional"><Textarea aria-label="Parecer profissional" rows={6} value={input.professionalConclusion} onChange={event => change({ professionalConclusion: event.target.value })} /></Field>
        <Field label="Notas clinicas"><Textarea aria-label="Notas clinicas" value={input.notes} onChange={event => change({ notes: event.target.value })} /></Field>
        <section className="space-y-3 border-t pt-4"><h2 className="text-lg font-semibold">Secoes no diagnostico integrado</h2><div className="grid gap-3 sm:grid-cols-2">{([['context', 'Contexto'], ['measurements', 'Medidas e qualidade'], ['results', 'Resultados selecionados'], ['somatotype', 'Somatotipo'], ['phantom', 'Phantom'], ['conclusion', 'Parecer']] as const).map(([key, label]) => <label key={key} className="flex gap-2 items-center text-sm"><input type="checkbox" checked={input.reportSections?.includes(key) ?? true} onChange={event => { const selected = input.reportSections ?? ['context', 'measurements', 'results', 'somatotype', 'phantom', 'conclusion']; change({ reportSections: event.target.checked ? [...selected, key] : selected.filter(section => section !== key) }); }} />{label}</label>)}</div></section>
        <section className="space-y-4 border-t pt-4"><h2 className="text-lg font-semibold">Cenarios opcionais</h2><div className="grid gap-4 sm:grid-cols-3">{([['fatPercent', 'Gordura alvo (%)'], ['muscleBoneRatio', 'Indice musculo/osseo alvo'], ['bmi', 'IMC alvo']] as const).map(([key, label]) => <Field key={key} label={label}><DecimalInput label={label} value={input.targets[key]} onInvalid={invalid => markInvalid(key, invalid)} onChange={value => change({ targets: { ...input.targets, [key]: value } })} /></Field>)}</div>
          <div className="grid gap-4 sm:grid-cols-2"><Field label="Metodo muscular do cenario"><Select aria-label="Metodo muscular do cenario" value={input.targets.muscleMethod ?? ''} onChange={event => change({ targets: { ...input.targets, muscleMethod: (event.target.value || null) as InputData['targets']['muscleMethod'] } })}><option value="">Selecionar</option><option value="martin1990">Martin 1990</option><option value="lee2000">Lee 2000</option><option value="kerrMuscle1988">Kerr 1988</option></Select></Field><Field label="Metodo osseo do cenario"><Select aria-label="Metodo osseo do cenario" value={input.targets.boneMethod ?? ''} onChange={event => change({ targets: { ...input.targets, boneMethod: (event.target.value || null) as InputData['targets']['boneMethod'] } })}><option value="">Selecionar</option><option value="martinBone1991">Martin 1991</option><option value="rocha1975">Rocha 1975</option></Select></Field></div>
          <p className="text-xs text-gray-600">Cenarios definidos pelo profissional, nao peso ideal nem previsao de resposta. Metas por gordura podem estar indisponiveis neste conjunto de medidas.</p>
        </section><section className="space-y-3 border-t pt-4"><h2 className="text-lg font-semibold">Cenario de energia</h2><Field label="Fator de atividade"><DecimalInput label="Fator de atividade" value={input.activityFactor} onInvalid={invalid => markInvalid('activityFactor', invalid)} onChange={value => change({ activityFactor: value })} /></Field><Field label="Justificativa do fator"><Textarea aria-label="Justificativa do fator" value={input.activityJustification} onChange={event => change({ activityJustification: event.target.value })} /></Field></section>
      </div>
    </fieldset>
    <footer className="flex flex-wrap items-center justify-between gap-3 border-t pt-4"><Button variant="secondary" disabled={saving} onClick={() => { if (!dirty || window.confirm('Ha alteracoes nao salvas. Sair sem salvar?')) router.push(previous?.href ?? `/avaliacoes/${avaliacaoId}`); }}><ArrowLeft size={16} />Voltar</Button><span className="text-xs text-gray-500" aria-live="polite">{dirty ? 'Alteracoes nao salvas' : revision == null ? 'Rascunho ainda nao salvo' : `Revisao ${revision} salva`}</span><Button disabled={saving || invalidNumber} onClick={async () => { if ((dirty || revision == null) && !await save()) return; router.push(next?.href ?? `/avaliacoes/${avaliacaoId}/revisao`); }}>Salvar e continuar<ArrowRight size={16} /></Button></footer>
  </div>;
}
