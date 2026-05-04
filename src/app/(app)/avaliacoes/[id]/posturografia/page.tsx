'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Label, Textarea } from '@/components/ui/Input';
import { SaveIndicator } from '@/components/ui/SaveIndicator';
import { useAutoSave } from '@/lib/useAutoSave';
import { upsertModulo, buscarModulo } from '@/lib/modulos';
import { createClient } from '@/lib/supabase/client';
import { Upload, ImageIcon } from 'lucide-react';
import { scorePostura } from '@/lib/scores';
import { buildSteps } from '@/lib/steps';

const VISTAS = [
  { key: 'foto_anterior', label: 'Anterior' },
  { key: 'foto_posterior', label: 'Posterior' },
  { key: 'foto_lateral_dir', label: 'Lateral direita' },
  { key: 'foto_lateral_esq', label: 'Lateral esquerda' },
] as const;

const ALINHAMENTOS = [
  ['cabeca_anteriorizada', 'Cabeça anteriorizada'],
  ['ombros_protrusos', 'Ombros protrusos'],
  ['hipercifose_toracica', 'Hipercifose torácica'],
  ['hiperlordose_lombar', 'Hiperlordose lombar'],
  ['retificacao_lombar', 'Retificação lombar'],
  ['escoliose', 'Escoliose'],
  ['assimetria_ombros', 'Assimetria de ombros'],
  ['assimetria_pelvica', 'Assimetria pélvica'],
  ['joelhos_valgo', 'Joelhos em valgo'],
  ['joelhos_varo', 'Joelhos em varo'],
  ['joelhos_recurvato', 'Joelhos recurvatum'],
  ['pe_plano', 'Pé plano'],
  ['pe_cavo', 'Pé cavo'],
] as const;

export default function PosturografiaPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const supabase = createClient();
  const [aval, setAval] = useState<any>(null);
  const [form, setForm] = useState<any>({
    foto_anterior: null, foto_posterior: null,
    foto_lateral_dir: null, foto_lateral_esq: null,
    alinhamentos: {}, observacoes: ''
  });
  const [loaded, setLoaded] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => { (async () => {
    const { data: av } = await supabase.from('avaliacoes').select('modulos_selecionados').eq('id', params.id).single();
    setAval(av);
    const d = await buscarModulo('posturografia', params.id);
    if (d) setForm((p: any) => ({ ...p, ...d }));
    setLoaded(true);
  })(); }, [params.id, supabase]);

  const saveState = useAutoSave(form, async v => {
    if (!loaded) return;
    await upsertModulo('posturografia', params.id, {
      foto_anterior: v.foto_anterior, foto_posterior: v.foto_posterior,
      foto_lateral_dir: v.foto_lateral_dir, foto_lateral_esq: v.foto_lateral_esq,
      alinhamentos: v.alinhamentos, observacoes: v.observacoes,
    });
  });

  async function upload(key: string, file: File) {
    setUploading(key);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const ext = file.name.split('.').pop();
    const path = `${user.id}/${params.id}/${key}_${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('posturografia').upload(path, file, { upsert: true });
    if (error) { alert(error.message); setUploading(null); return; }
    const { data } = supabase.storage.from('posturografia').createSignedUrl
      ? await supabase.storage.from('posturografia').createSignedUrl(path, 60 * 60 * 24 * 365)
      : { data: { signedUrl: supabase.storage.from('posturografia').getPublicUrl(path).data.publicUrl } };
    setForm((f: any) => ({ ...f, [key]: data?.signedUrl ?? path }));
    setUploading(null);
  }

  const toggle = (k: string) => setForm((f: any) => ({
    ...f, alinhamentos: { ...f.alinhamentos, [k]: !f.alinhamentos[k] }
  }));

  const score = scorePostura(form.alinhamentos);
  const steps = aval ? buildSteps(params.id, aval.modulos_selecionados) : [];
  const prevStep = steps.find(s => s.key === 'sinais_vitais') ?? steps.find(s => s.key === 'anamnese');
  const nextStep = steps.find(s => s.key === 'bioimpedancia')
    ?? steps.find(s => s.key === 'antropometria')
    ?? steps.find(s => s.key === 'flexibilidade')
    ?? steps.find(s => s.key === 'forca')
    ?? steps.find(s => s.key === 'revisao');

  return (
    <div className="space-y-5 max-w-5xl">
      <Card>
        <CardHeader><CardTitle>Fotos posturais (4 vistas)</CardTitle></CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {VISTAS.map(v => (
              <div key={v.key}>
                <Label>{v.label}</Label>
                <label className="block aspect-[3/4] rounded-lg border-2 border-dashed border-slate-300 hover:border-brand-400 cursor-pointer overflow-hidden bg-slate-50 relative">
                  {form[v.key] ? (
                    <img src={form[v.key]} alt={v.label} className="w-full h-full object-contain bg-slate-100" />
                  ) : (
                    <div className="absolute inset-0 grid place-items-center text-slate-400">
                      {uploading === v.key ? (
                        <span className="text-xs">Enviando…</span>
                      ) : (
                        <div className="text-center">
                          <Upload className="w-6 h-6 mx-auto mb-1" />
                          <span className="text-xs">Enviar</span>
                        </div>
                      )}
                    </div>
                  )}
                  <input type="file" accept="image/*" className="hidden"
                    onChange={e => e.target.files?.[0] && upload(v.key, e.target.files[0])} />
                </label>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Análise de alinhamentos
            {score != null && <span className="ml-3 text-sm font-normal text-slate-500">Score parcial: <strong className={score > 70 ? 'text-emerald-600' : score > 40 ? 'text-amber-600' : 'text-red-600'}>{score}</strong></span>}
          </CardTitle>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {ALINHAMENTOS.map(([k, label]) => (
              <label key={k} className="flex items-center gap-2 text-sm p-2 rounded hover:bg-slate-50 cursor-pointer">
                <input type="checkbox" checked={!!form.alinhamentos[k]} onChange={() => toggle(k)} />
                {label}
              </label>
            ))}
          </div>
          <div className="mt-4">
            <Label>Observações</Label>
            <Textarea value={form.observacoes || ''} onChange={e => setForm((f: any) => ({ ...f, observacoes: e.target.value }))} />
          </div>
        </CardBody>
      </Card>

      <div className="flex justify-between">
        <Button variant="secondary" onClick={() => router.push(prevStep?.href ?? `/avaliacoes/${params.id}/sinais-vitais`)}>← Voltar</Button>
        <Button onClick={() => router.push(nextStep?.href ?? `/avaliacoes/${params.id}/revisao`)}>Continuar →</Button>
      </div>
      <SaveIndicator state={saveState} />
    </div>
  );
}
