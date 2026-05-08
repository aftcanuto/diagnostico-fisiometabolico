'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Field, Input, Textarea, Label } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, ImageIcon, Trash2, Upload } from 'lucide-react';
import Link from 'next/link';

const MODULOS = [
  { k: 'anamnese',            label: 'Anamnese' },
  { k: 'sinais_vitais',       label: 'Sinais vitais' },
  { k: 'posturografia',       label: 'Posturografia' },
  { k: 'bioimpedancia',       label: 'Bioimpedância' },
  { k: 'antropometria',       label: 'Antropometria (ISAK)' },
  { k: 'flexibilidade',       label: 'Flexibilidade' },
  { k: 'forca',               label: 'Força' },
  { k: 'rml',                 label: 'RML (Resist. Muscular)' },
  { k: 'cardiorrespiratorio', label: 'Cardiorrespiratório' },
  { k: 'biomecanica_corrida', label: 'Biomecânica da corrida' },
];

const TODOS_MODULOS = Object.fromEntries(MODULOS.map(m => [m.k, true]));
const NENHUM_MODULO = Object.fromEntries(MODULOS.map(m => [m.k, false]));

export function ProdutoForm({ id }: { id?: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [form, setForm] = useState<any>({
    nome: '', descricao: '', duracao_minutos: '', preco: '',
    ativo: true, padrao: false, produto_livre: false, anamnese_obrigatoria: true,
    imagem_url: '',
    modulos: TODOS_MODULOS,
  });
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    supabase.from('produtos').select('*').eq('id', id).single().then(({ data }) => {
      if (data) setForm({
        ...data,
        modulos: { ...NENHUM_MODULO, ...(data.modulos ?? {}) },
        produto_livre: !!data.produto_livre,
        anamnese_obrigatoria: data.anamnese_obrigatoria ?? !!data.modulos?.anamnese,
        imagem_url: data.imagem_url ?? '',
        duracao_minutos: data.duracao_minutos ?? '',
        preco: data.preco ?? '',
      });
      else setNotFound(true);
      setLoading(false);
    });
  }, [id, supabase]);

  async function salvar() {
    setSaving(true);
    const { data: clinicaId } = await supabase.rpc('current_clinica_id');
    const modulosPayload = form.produto_livre
      ? NENHUM_MODULO
      : {
          ...NENHUM_MODULO,
          ...(form.modulos ?? {}),
          anamnese: !!form.anamnese_obrigatoria,
        };
    const payload = {
      ...form,
      modulos: modulosPayload,
      clinica_id: clinicaId,
      imagem_url: form.imagem_url || null,
      duracao_minutos: form.duracao_minutos === '' ? null : Number(form.duracao_minutos),
      preco: form.preco === '' ? null : Number(form.preco),
    };
    if (id) {
      const { error } = await supabase.from('produtos').update(payload).eq('id', id);
      if (error) { alert(error.message); setSaving(false); return; }
    } else {
      const { error } = await supabase.from('produtos').insert(payload);
      if (error) { alert(error.message); setSaving(false); return; }
    }
    router.push('/produtos');
  }

  async function excluir() {
    if (!id) return;
    if (!confirm('Excluir este produto?')) return;
    const { error } = await supabase.from('produtos').delete().eq('id', id);
    if (error) { alert(error.message); return; }
    router.push('/produtos');
  }

  async function uploadImagem(file: File) {
    const { data: clinicaId } = await supabase.rpc('current_clinica_id');
    if (!clinicaId) {
      alert('Clínica não encontrada para enviar a imagem.');
      return;
    }
    const ext = file.name.split('.').pop() || 'png';
    const safeName = `${clinicaId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from('produto-imagens').upload(safeName, file, {
      upsert: true,
      contentType: file.type || 'image/png',
    });
    if (error) {
      alert(error.message);
      return;
    }
    const { data } = supabase.storage.from('produto-imagens').getPublicUrl(safeName);
    setForm((f: any) => ({ ...f, imagem_url: data.publicUrl }));
  }

  if (loading) return <p className="text-slate-500">Carregando…</p>;

  if (notFound) return <p className="text-red-600">Produto nÃ£o encontrado ou sem permissÃ£o para editar.</p>;

  return (
    <div className="max-w-3xl space-y-5">
      <Link href="/produtos" className="text-sm text-brand-600 hover:underline inline-flex items-center gap-1">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </Link>
      <h1 className="text-2xl font-bold text-slate-800">{id ? 'Editar produto' : 'Novo produto'}</h1>

      <Card>
        <CardHeader><CardTitle>Informações</CardTitle></CardHeader>
        <CardBody className="space-y-4">
          <Field label="Nome *">
            <Input value={form.nome} onChange={e => setForm((f: any) => ({ ...f, nome: e.target.value }))} placeholder='Ex: "Check-up Executivo"' />
          </Field>
          <Field label="Descrição">
            <Textarea value={form.descricao ?? ''} onChange={e => setForm((f: any) => ({ ...f, descricao: e.target.value }))} />
          </Field>
          <Field label="Imagem ilustrativa">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-3">
              {form.imagem_url ? (
                <div className="flex items-center gap-3">
                  <img src={form.imagem_url} alt="Imagem do produto" className="h-16 w-16 rounded-lg object-cover border border-slate-200 bg-white" />
                  <Input value={form.imagem_url} onChange={e => setForm((f: any) => ({ ...f, imagem_url: e.target.value }))} />
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <ImageIcon className="h-4 w-4" />
                  Nenhuma imagem configurada.
                </div>
              )}
              <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-100">
                <Upload className="h-4 w-4" />
                Enviar imagem
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) uploadImagem(file);
                  }}
                />
              </label>
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Duração (min)">
              <Input type="number" value={form.duracao_minutos} onChange={e => setForm((f: any) => ({ ...f, duracao_minutos: e.target.value }))} />
            </Field>
            <Field label="Preço (R$)">
              <Input type="number" step="0.01" value={form.preco} onChange={e => setForm((f: any) => ({ ...f, preco: e.target.value }))} />
            </Field>
          </div>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.ativo} onChange={e => setForm((f: any) => ({ ...f, ativo: e.target.checked }))} />
              Ativo
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.padrao} onChange={e => setForm((f: any) => ({ ...f, padrao: e.target.checked }))} />
              Produto padrão
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={!!form.produto_livre}
                onChange={e => setForm((f: any) => ({
                  ...f,
                  produto_livre: e.target.checked,
                  modulos: e.target.checked ? NENHUM_MODULO : f.modulos,
                  anamnese_obrigatoria: e.target.checked ? false : f.anamnese_obrigatoria,
                }))}
              />
              Produto livre
            </label>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle>Módulos incluídos</CardTitle></CardHeader>
        <CardBody>
          <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                checked={!!form.anamnese_obrigatoria}
                disabled={!!form.produto_livre}
                onChange={e => setForm((f: any) => ({
                  ...f,
                  anamnese_obrigatoria: e.target.checked,
                  modulos: { ...f.modulos, anamnese: e.target.checked },
                }))}
              />
              <span>
                <span className="font-medium text-slate-800">Exigir anamnese neste produto</span>
                <span className="block text-xs text-slate-500">Quando desmarcado, a avaliação pode iniciar direto no primeiro módulo selecionado.</span>
              </span>
            </label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {MODULOS.map(m => (
              <label key={m.k} className="flex items-center gap-2 p-2 rounded hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={m.k === 'anamnese' ? !!form.anamnese_obrigatoria : !!form.modulos[m.k]}
                  disabled={!!form.produto_livre || m.k === 'anamnese'}
                  onChange={e => setForm((f: any) => ({ ...f, modulos: { ...f.modulos, [m.k]: e.target.checked } }))}
                />
                <span>{m.label}{m.k === 'anamnese' && <span className="text-xs text-slate-400 ml-1">(controlada acima)</span>}</span>
              </label>
            ))}
          </div>
        </CardBody>
      </Card>

      <div className="flex justify-between">
        {id ? (
          <Button variant="danger" onClick={excluir}><Trash2 className="w-4 h-4" /> Excluir</Button>
        ) : <div />}
        <div className="flex gap-2">
          <Link href="/produtos"><Button variant="secondary">Cancelar</Button></Link>
          <Button onClick={salvar} disabled={saving || !form.nome}>
            {saving ? 'Salvando…' : 'Salvar'}
          </Button>
        </div>
      </div>
    </div>
  );
}
