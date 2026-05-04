'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Field, Input, Textarea, Label } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Trash2 } from 'lucide-react';
import Link from 'next/link';

const MODULOS = [
  { k: 'anamnese',            label: 'Anamnese',             obrig: true },
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

export function ProdutoForm({ id }: { id?: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [form, setForm] = useState<any>({
    nome: '', descricao: '', duracao_minutos: '', preco: '',
    ativo: true, padrao: false,
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
        modulos: { ...TODOS_MODULOS, ...(data.modulos ?? {}) },
        duracao_minutos: data.duracao_minutos ?? '',
        preco: data.preco ?? '',
      });
      else setNotFound(true);
      setLoading(false);
    });
  }, [id, supabase]);

  async function salvar() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { data: clinicaId } = await supabase.rpc('current_clinica_id');
    const payload = {
      ...form,
      modulos: { ...TODOS_MODULOS, ...(form.modulos ?? {}), anamnese: true },
      clinica_id: clinicaId,
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
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle>Módulos incluídos</CardTitle></CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {MODULOS.map(m => (
              <label key={m.k} className="flex items-center gap-2 p-2 rounded hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={!!form.modulos[m.k]}
                  disabled={m.obrig}
                  onChange={e => setForm((f: any) => ({ ...f, modulos: { ...f.modulos, [m.k]: e.target.checked } }))}
                />
                <span>{m.label}{m.obrig && <span className="text-xs text-slate-400 ml-1">(obrigatório)</span>}</span>
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
