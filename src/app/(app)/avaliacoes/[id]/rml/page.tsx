'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Field, Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { SaveIndicator } from '@/components/ui/SaveIndicator';
import { buildSteps } from '@/lib/steps';
import { buscarModulo, upsertModulo } from '@/lib/modulos';
import { useAutoSave } from '@/lib/useAutoSave';
import { createClient } from '@/lib/supabase/client';
import { calcularRML, PROTOCOLOS_RML } from '@/lib/calculations/rml';
import { Info, CheckCircle2 } from 'lucide-react';

/* ── Cores de classificação ─────────────────────────────────────────────────── */
const COR_CLASSE: Record<string, string> = {
  'Excelente':   'bg-emerald-100 text-emerald-800 border-emerald-300',
  'Bom':         'bg-blue-100 text-blue-800 border-blue-300',
  'Regular':     'bg-amber-100 text-amber-800 border-amber-300',
  'Fraco':       'bg-orange-100 text-orange-800 border-orange-300',
  'Muito fraco': 'bg-red-100 text-red-800 border-red-300',
};

/* ── Badge de classificação ─────────────────────────────────────────────────── */
function ClassBadge({ cls }: { cls?: string | null }) {
  if (!cls) return null;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-700 border ${COR_CLASSE[cls] ?? 'bg-gray-100 text-gray-700 border-gray-300'}`}>
      <CheckCircle2 size={12} />
      {cls}
    </span>
  );
}

/* ── Card de protocolo ──────────────────────────────────────────────────────── */
function ProtocoloCard({ proto }: { proto: { nome: string; descricao: string; fonte: string } }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-3">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-800 font-medium"
      >
        <Info size={13} />
        {open ? 'Ocultar protocolo' : 'Ver protocolo'}
      </button>
      {open && (
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 leading-relaxed">
          <p className="font-semibold mb-1">{proto.nome}</p>
          <p className="mb-1">{proto.descricao}</p>
          <p className="text-blue-600">Fonte: {proto.fonte}</p>
        </div>
      )}
    </div>
  );
}

/* ── Componente principal ───────────────────────────────────────────────────── */
export default function RMLPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const avalId = params.id;

  const [categoria, setCategoria]   = useState<'jovem_ativo' | 'idoso'>('jovem_ativo');
  const [sexo, setSexo]             = useState<'M' | 'F'>('M');
  const [idade, setIdade]           = useState<number>(30);

  // Jovem/ativo
  const [mmssModalidade, setMmssModalidade] = useState<'tradicional' | 'modificada'>('tradicional');
  const [mmssReps, setMmssReps]           = useState('');
  const [abd1minReps, setAbd1minReps]     = useState('');
  const [abdPranchaSeg, setAbdPranchaSeg] = useState('');
  const [mmiiAgachReps, setMmiiAgachReps] = useState('');
  const [mmiiWallsitSeg, setMmiiWallsitSeg] = useState('');

  // Idoso
  const [idosoSlReps, setIdosoSlReps]         = useState('');
  const [idosoArmcurlReps, setIdosoArmcurlReps] = useState('');

  const [observacoes, setObservacoes] = useState('');
  const [steps, setSteps]             = useState<any[]>([]);
  const [saving, setSaving]           = useState(false);
  const [saved, setSaved]             = useState(false);

  // Cálculo automático
  const resultado = calcularRML({
    categoria,
    sexo,
    idade,
    mmss_modalidade: mmssModalidade,
    mmss_reps:        mmssReps        ? Number(mmssReps)        : undefined,
    abd_1min_reps:    abd1minReps     ? Number(abd1minReps)     : undefined,
    abd_prancha_seg:  abdPranchaSeg   ? Number(abdPranchaSeg)   : undefined,
    mmii_agach_reps:  mmiiAgachReps   ? Number(mmiiAgachReps)   : undefined,
    mmii_wallsit_seg: mmiiWallsitSeg  ? Number(mmiiWallsitSeg)  : undefined,
    idoso_sl_reps:    idosoSlReps     ? Number(idosoSlReps)     : undefined,
    idoso_armcurl_reps: idosoArmcurlReps ? Number(idosoArmcurlReps) : undefined,
  });

  // Carregar dados salvos
  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: aval } = await supabase
        .from('avaliacoes').select('*').eq('id', avalId).single();
      if (!aval) return;

      // Buscar dados do paciente para idade e sexo
      const { data: pac } = await supabase
        .from('pacientes').select('data_nascimento, sexo').eq('id', aval.paciente_id).single();
      if (pac) {
        setSexo(pac.sexo ?? 'M');
        const nascimento = new Date(pac.data_nascimento);
        const hoje = new Date();
        setIdade(hoje.getFullYear() - nascimento.getFullYear());
      }

      setSteps(buildSteps(avalId, aval.modulos_selecionados));

      const d = await buscarModulo('rml', avalId);
      if (!d) return;
      setCategoria(d.categoria ?? 'jovem_ativo');
      setMmssModalidade(d.mmss_modalidade ?? 'tradicional');
      setMmssReps(d.mmss_reps?.toString() ?? '');
      setAbd1minReps(d.abd_1min_reps?.toString() ?? '');
      setAbdPranchaSeg(d.abd_prancha_seg?.toString() ?? '');
      setMmiiAgachReps(d.mmii_agach_reps?.toString() ?? '');
      setMmiiWallsitSeg(d.mmii_wallsit_seg?.toString() ?? '');
      setIdosoSlReps(d.idoso_sl_reps?.toString() ?? '');
      setIdosoArmcurlReps(d.idoso_armcurl_reps?.toString() ?? '');
      setObservacoes(d.observacoes ?? '');
    }
    load();
  }, [avalId]);

  // Payload para salvar
  const payload = {
    categoria,
    mmss_modalidade:          mmssModalidade || null,
    mmss_reps:                mmssReps     ? Number(mmssReps)     : null,
    mmss_classificacao:       resultado.mmss_classificacao ?? null,
    abd_1min_reps:            abd1minReps  ? Number(abd1minReps)  : null,
    abd_1min_classificacao:   resultado.abd_1min_classificacao ?? null,
    abd_prancha_seg:          abdPranchaSeg ? Number(abdPranchaSeg) : null,
    abd_prancha_classificacao: resultado.abd_prancha_classificacao ?? null,
    mmii_agach_reps:          mmiiAgachReps ? Number(mmiiAgachReps) : null,
    mmii_agach_classificacao: resultado.mmii_agach_classificacao ?? null,
    mmii_wallsit_seg:         mmiiWallsitSeg ? Number(mmiiWallsitSeg) : null,
    mmii_wallsit_classificacao: resultado.mmii_wallsit_classificacao ?? null,
    idoso_sl_reps:            idosoSlReps ? Number(idosoSlReps) : null,
    idoso_sl_classificacao:   resultado.idoso_sl_classificacao ?? null,
    idoso_armcurl_reps:       idosoArmcurlReps ? Number(idosoArmcurlReps) : null,
    idoso_armcurl_classificacao: resultado.idoso_armcurl_classificacao ?? null,
    score:                    resultado.score,
    observacoes:              observacoes || null,
  };

  const autoSaveState = useAutoSave(payload, async (p) => {
    await upsertModulo('rml', avalId, p);
    // Atualizar score
    const supabase = createClient();
    await supabase.from('scores').upsert(
      { avaliacao_id: avalId, rml: resultado.score },
      { onConflict: 'avaliacao_id' }
    );
  });

  async function handleSave() {
    setSaving(true);
    try {
      await upsertModulo('rml', avalId, payload);
      const supabase = createClient();
      await supabase.from('scores').upsert(
        { avaliacao_id: avalId, rml: resultado.score },
        { onConflict: 'avaliacao_id' }
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  async function handleNext() {
    await handleSave();
    const next = steps.find(s => s.key === 'cardiorrespiratorio')
      ?? steps.find(s => s.key === 'biomecanica')
      ?? steps.find(s => s.key === 'revisao');
    router.push(next?.href ?? `/avaliacoes/${avalId}/revisao`);
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-800 text-gray-900">Resistência Muscular Localizada</h1>
            <p className="text-sm text-gray-500 mt-1">Avaliação de RML por categoria etária</p>
          </div>
          <div className="flex items-center gap-3">
            <SaveIndicator state={saving ? 'saving' : saved ? 'saved' : autoSaveState} />
            {resultado.score > 0 && (
              <div className="flex flex-col items-center px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl">
                <span className="text-2xl font-900 text-emerald-600">{resultado.score}</span>
                <span className="text-xs text-emerald-600 font-600">Score RML</span>
              </div>
            )}
          </div>
        </div>

        {/* Seleção de categoria */}
        <Card>
          <CardHeader><CardTitle>Perfil do avaliado</CardTitle></CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-600 text-gray-700 mb-2">
                  Categoria da avaliação
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setCategoria('jovem_ativo')}
                    className={`flex-1 py-3 px-4 rounded-xl border-2 text-sm font-600 transition-all ${
                      categoria === 'jovem_ativo'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    Jovem / Ativo
                    <div className="text-xs font-400 mt-0.5 opacity-70">Até 59 anos</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategoria('idoso')}
                    className={`flex-1 py-3 px-4 rounded-xl border-2 text-sm font-600 transition-all ${
                      categoria === 'idoso'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    Idoso
                    <div className="text-xs font-400 mt-0.5 opacity-70">A partir de 60 anos</div>
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Sexo">
                  <Select value={sexo} onChange={e => setSexo(e.target.value as 'M' | 'F')}>
                    <option value="M">Masculino</option>
                    <option value="F">Feminino</option>
                  </Select>
                </Field>
                <Field label="Idade (anos)">
                  <Input
                    type="number" min="10" max="110"
                    value={idade}
                    onChange={e => setIdade(Number(e.target.value))}
                  />
                </Field>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* ── JOVEM / ATIVO ─────────────────────────────────────────────────── */}
        {categoria === 'jovem_ativo' && (
          <>
            {/* MMSS */}
            <Card>
              <CardHeader>
                <CardTitle>RML de MMSS — Flexão de braço</CardTitle>
              </CardHeader>
              <CardBody>
                <div className="mb-4">
                  <label className="block text-sm font-600 text-gray-700 mb-2">Modalidade</label>
                  <div className="flex gap-3">
                    {(['tradicional', 'modificada'] as const).map(m => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMmssModalidade(m)}
                        className={`px-4 py-2 rounded-lg border text-sm font-500 transition-all ${
                          mmssModalidade === m
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {m === 'tradicional' ? 'Tradicional (joelhos estendidos)' : 'Modificada (joelhos apoiados)'}
                      </button>
                    ))}
                  </div>
                </div>
                <ProtocoloCard proto={
                  mmssModalidade === 'tradicional'
                    ? PROTOCOLOS_RML.flexao_tradicional
                    : PROTOCOLOS_RML.flexao_modificada
                } />
                <div className="grid grid-cols-2 gap-4 items-end">
                  <Field label="Repetições">
                    <Input
                      type="number" min="0" placeholder="0"
                      value={mmssReps}
                      onChange={e => setMmssReps(e.target.value)}
                    />
                  </Field>
                  <div className="pb-1">
                    <ClassBadge cls={resultado.mmss_classificacao} />
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* ABDOMINAL */}
            <Card>
              <CardHeader><CardTitle>RML Abdominal</CardTitle></CardHeader>
              <CardBody className="space-y-6">
                {/* Teste 1 */}
                <div>
                  <p className="text-sm font-600 text-gray-700 mb-2">Teste 1 — Abdominal em 1 minuto</p>
                  <ProtocoloCard proto={PROTOCOLOS_RML.abdominal_1min} />
                  <div className="grid grid-cols-2 gap-4 items-end">
                    <Field label="Repetições em 1 min">
                      <Input
                        type="number" min="0" placeholder="0"
                        value={abd1minReps}
                        onChange={e => setAbd1minReps(e.target.value)}
                      />
                    </Field>
                    <div className="pb-1"><ClassBadge cls={resultado.abd_1min_classificacao} /></div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm font-600 text-gray-700 mb-2">Teste 2 — Prancha ventral máxima</p>
                  <ProtocoloCard proto={PROTOCOLOS_RML.prancha_ventral} />
                  <div className="grid grid-cols-2 gap-4 items-end">
                    <Field label="Tempo sustentado (segundos)">
                      <Input
                        type="number" min="0" placeholder="0"
                        value={abdPranchaSeg}
                        onChange={e => setAbdPranchaSeg(e.target.value)}
                      />
                    </Field>
                    <div className="pb-1"><ClassBadge cls={resultado.abd_prancha_classificacao} /></div>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* MMII */}
            <Card>
              <CardHeader><CardTitle>RML de MMII</CardTitle></CardHeader>
              <CardBody className="space-y-6">
                {/* Agachamento */}
                <div>
                  <p className="text-sm font-600 text-gray-700 mb-2">Teste 1 — Agachamento livre em 1 minuto</p>
                  <ProtocoloCard proto={PROTOCOLOS_RML.agachamento_1min} />
                  <div className="grid grid-cols-2 gap-4 items-end">
                    <Field label="Repetições em 1 min">
                      <Input
                        type="number" min="0" placeholder="0"
                        value={mmiiAgachReps}
                        onChange={e => setMmiiAgachReps(e.target.value)}
                      />
                    </Field>
                    <div className="pb-1"><ClassBadge cls={resultado.mmii_agach_classificacao} /></div>
                  </div>
                </div>

                {/* Wall sit */}
                <div className="border-t pt-4">
                  <p className="text-sm font-600 text-gray-700 mb-1">
                    Teste 2 — Wall sit{' '}
                    <span className="text-xs font-400 text-gray-400">(opcional)</span>
                  </p>
                  <ProtocoloCard proto={PROTOCOLOS_RML.wall_sit} />
                  <div className="grid grid-cols-2 gap-4 items-end">
                    <Field label="Tempo sustentado (segundos)">
                      <Input
                        type="number" min="0" placeholder="0"
                        value={mmiiWallsitSeg}
                        onChange={e => setMmiiWallsitSeg(e.target.value)}
                      />
                    </Field>
                    <div className="pb-1"><ClassBadge cls={resultado.mmii_wallsit_classificacao} /></div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </>
        )}

        {/* ── IDOSO ────────────────────────────────────────────────────────── */}
        {categoria === 'idoso' && (
          <>
            <Card>
              <CardHeader><CardTitle>RML de MMII — Sentar e Levantar 30s</CardTitle></CardHeader>
              <CardBody>
                <ProtocoloCard proto={PROTOCOLOS_RML.sentar_levantar_30s} />
                <div className="grid grid-cols-2 gap-4 items-end">
                  <Field label="Repetições em 30s">
                    <Input
                      type="number" min="0" placeholder="0"
                      value={idosoSlReps}
                      onChange={e => setIdosoSlReps(e.target.value)}
                    />
                  </Field>
                  <div className="pb-1"><ClassBadge cls={resultado.idoso_sl_classificacao} /></div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader><CardTitle>RML de MMSS Funcional — Arm Curl Test 30s</CardTitle></CardHeader>
              <CardBody>
                <ProtocoloCard proto={PROTOCOLOS_RML.arm_curl_30s} />
                <div className="grid grid-cols-2 gap-4 items-end">
                  <Field label="Repetições em 30s">
                    <Input
                      type="number" min="0" placeholder="0"
                      value={idosoArmcurlReps}
                      onChange={e => setIdosoArmcurlReps(e.target.value)}
                    />
                  </Field>
                  <div className="pb-1"><ClassBadge cls={resultado.idoso_armcurl_classificacao} /></div>
                </div>
              </CardBody>
            </Card>
          </>
        )}

        {/* Observações */}
        <Card>
          <CardBody>
            <Field label="Observações clínicas">
              <textarea
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
                rows={3}
                placeholder="Condições especiais, intercorrências, adaptações de protocolo..."
                value={observacoes}
                onChange={e => setObservacoes(e.target.value)}
              />
            </Field>
          </CardBody>
        </Card>

        {/* Ações */}
        <div className="flex justify-between">
          <Button variant="secondary" onClick={() => {
            const prev = steps.find(s => s.key === 'forca')
              ?? steps.find(s => s.key === 'flexibilidade')
              ?? steps.find(s => s.key === 'antropometria');
            router.push(prev?.href ?? `/avaliacoes/${avalId}/forca`);
          }}>
            Voltar
          </Button>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={handleSave} disabled={saving}>
              {saving ? 'Salvando…' : 'Salvar'}
            </Button>
            <Button onClick={handleNext}>
              Próximo →
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
