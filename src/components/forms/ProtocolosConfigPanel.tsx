'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select, Textarea } from '@/components/ui/Input';
import { ClipboardList, Plus, Save, Trash2 } from 'lucide-react';

const MODULOS = [
  ['anamnese', 'Anamnese'],
  ['sinais_vitais', 'Sinais vitais'],
  ['posturografia', 'Posturografia'],
  ['bioimpedancia', 'Bioimpedância'],
  ['antropometria', 'Antropometria'],
  ['flexibilidade', 'Flexibilidade'],
  ['forca', 'Força'],
  ['rml', 'RML'],
  ['cardiorrespiratorio', 'Cardiorrespiratório'],
  ['biomecanica_corrida', 'Biomecânica da corrida'],
];

const VAZIO = {
  modulo: 'anamnese',
  titulo: '',
  texto: '',
  ativo: true,
  padrao: false,
};

export function ProtocolosConfigPanel({ clinicaId }: { clinicaId: string }) {
  const supabase = createClient();
  const [itens, setItens] = useState<any[]>([]);
  const [selecionado, setSelecionado] = useState<any>(VAZIO);
  const [salvando, setSalvando] = useState(false);

  async function carregar() {
    const { data } = await supabase
      .from('protocolo_recomendacoes')
      .select('*')
      .eq('clinica_id', clinicaId)
      .order('modulo')
      .order('padrao', { ascending: false })
      .order('titulo');
    setItens(data ?? []);
  }

  useEffect(() => { carregar(); }, []);

  async function salvar() {
    setSalvando(true);
    const payload = { ...selecionado, clinica_id: clinicaId };
    const query = selecionado.id
      ? supabase.from('protocolo_recomendacoes').update(payload).eq('id', selecionado.id)
      : supabase.from('protocolo_recomendacoes').insert(payload);
    const { error } = await query;
    setSalvando(false);
    if (error) {
      alert(error.message);
      return;
    }
    setSelecionado(VAZIO);
    carregar();
  }

  async function excluir() {
    if (!selecionado.id || !confirm('Excluir esta recomendação?')) return;
    const { error } = await supabase.from('protocolo_recomendacoes').delete().eq('id', selecionado.id);
    if (error) {
      alert(error.message);
      return;
    }
    setSelecionado(VAZIO);
    carregar();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <ClipboardList className="inline h-4 w-4 mr-1 text-brand-600" />
          Protocolos e recomendações pré-teste
        </CardTitle>
      </CardHeader>
      <CardBody className="grid gap-5 lg:grid-cols-[280px,1fr]">
        <div className="space-y-2">
          <Button variant="secondary" className="w-full" onClick={() => setSelecionado(VAZIO)}>
            <Plus className="h-4 w-4" /> Nova recomendação
          </Button>
          {itens.map(item => (
            <button
              key={item.id}
              onClick={() => setSelecionado(item)}
              className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${selecionado.id === item.id ? 'border-brand-300 bg-brand-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
            >
              <div className="font-medium text-slate-800">{item.titulo}</div>
              <div className="mt-0.5 text-xs text-slate-500">
                {labelModulo(item.modulo)} {item.padrao ? '· padrão' : ''} {!item.ativo ? '· inativa' : ''}
              </div>
            </button>
          ))}
          {itens.length === 0 && (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
              Nenhuma recomendação cadastrada.
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Módulo">
              <Select value={selecionado.modulo} onChange={e => setSelecionado((s: any) => ({ ...s, modulo: e.target.value }))}>
                {MODULOS.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
              </Select>
            </Field>
            <Field label="Título">
              <Input value={selecionado.titulo ?? ''} onChange={e => setSelecionado((s: any) => ({ ...s, titulo: e.target.value }))} />
            </Field>
          </div>
          <Field label="Texto da recomendação">
            <Textarea
              className="min-h-[180px]"
              value={selecionado.texto ?? ''}
              placeholder="Ex: Evite exercício intenso nas 24 horas anteriores, mantenha hidratação habitual e traga roupas adequadas para o teste."
              onChange={e => setSelecionado((s: any) => ({ ...s, texto: e.target.value }))}
            />
          </Field>
          <div className="flex flex-wrap gap-5">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!selecionado.ativo} onChange={e => setSelecionado((s: any) => ({ ...s, ativo: e.target.checked }))} />
              Ativa
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!selecionado.padrao} onChange={e => setSelecionado((s: any) => ({ ...s, padrao: e.target.checked }))} />
              Padrão do módulo
            </label>
          </div>
          <div className="flex justify-between">
            {selecionado.id ? (
              <Button variant="danger" onClick={excluir}><Trash2 className="h-4 w-4" /> Excluir</Button>
            ) : <div />}
            <Button onClick={salvar} disabled={salvando || !selecionado.titulo || !selecionado.texto}>
              <Save className="h-4 w-4" /> {salvando ? 'Salvando...' : 'Salvar recomendação'}
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

function labelModulo(modulo: string) {
  return MODULOS.find(([k]) => k === modulo)?.[1] ?? modulo;
}
