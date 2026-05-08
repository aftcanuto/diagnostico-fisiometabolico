'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select, Textarea } from '@/components/ui/Input';
import { FileCheck, Plus, Save, Trash2 } from 'lucide-react';

const MODELO_VAZIO = {
  tipo: 'consentimento_informado',
  nome: '',
  descricao: '',
  texto: '',
  ativo: true,
  padrao: false,
};

export function ConsentimentosConfigPanel({ clinicaId }: { clinicaId: string }) {
  const supabase = createClient();
  const [modelos, setModelos] = useState<any[]>([]);
  const [selecionado, setSelecionado] = useState<any>(MODELO_VAZIO);
  const [salvando, setSalvando] = useState(false);

  async function carregar() {
    const { data } = await supabase
      .from('consentimento_modelos')
      .select('*')
      .eq('clinica_id', clinicaId)
      .order('padrao', { ascending: false })
      .order('nome');
    setModelos(data ?? []);
  }

  useEffect(() => { carregar(); }, []);

  async function salvar() {
    setSalvando(true);
    const payload = {
      ...selecionado,
      clinica_id: clinicaId,
      texto: selecionado.texto || textoPadrao(selecionado.tipo),
    };
    const query = selecionado.id
      ? supabase.from('consentimento_modelos').update(payload).eq('id', selecionado.id)
      : supabase.from('consentimento_modelos').insert(payload);
    const { error } = await query;
    setSalvando(false);
    if (error) {
      alert(error.message);
      return;
    }
    setSelecionado(MODELO_VAZIO);
    carregar();
  }

  async function excluir() {
    if (!selecionado.id || !confirm('Excluir este modelo?')) return;
    const { error } = await supabase.from('consentimento_modelos').delete().eq('id', selecionado.id);
    if (error) {
      alert(error.message);
      return;
    }
    setSelecionado(MODELO_VAZIO);
    carregar();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <FileCheck className="inline h-4 w-4 mr-1 text-brand-600" />
          Consentimento informado e TCLE
        </CardTitle>
      </CardHeader>
      <CardBody className="grid gap-5 lg:grid-cols-[260px,1fr]">
        <div className="space-y-2">
          <Button variant="secondary" className="w-full" onClick={() => setSelecionado(MODELO_VAZIO)}>
            <Plus className="h-4 w-4" /> Novo modelo
          </Button>
          {modelos.map(m => (
            <button
              key={m.id}
              onClick={() => setSelecionado(m)}
              className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${selecionado.id === m.id ? 'border-brand-300 bg-brand-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
            >
              <div className="font-medium text-slate-800">{m.nome}</div>
              <div className="mt-0.5 text-xs text-slate-500">
                {m.tipo === 'tcle' ? 'TCLE' : 'Consentimento'} {m.padrao ? '· padrão' : ''}
              </div>
            </button>
          ))}
          {modelos.length === 0 && (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
              Nenhum modelo cadastrado.
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Tipo">
              <Select value={selecionado.tipo} onChange={e => setSelecionado((s: any) => ({ ...s, tipo: e.target.value }))}>
                <option value="consentimento_informado">Consentimento informado</option>
                <option value="tcle">TCLE</option>
              </Select>
            </Field>
            <Field label="Nome">
              <Input value={selecionado.nome ?? ''} onChange={e => setSelecionado((s: any) => ({ ...s, nome: e.target.value }))} />
            </Field>
          </div>
          <Field label="Descrição">
            <Input value={selecionado.descricao ?? ''} onChange={e => setSelecionado((s: any) => ({ ...s, descricao: e.target.value }))} />
          </Field>
          <Field label="Texto do termo">
            <Textarea
              className="min-h-[220px]"
              value={selecionado.texto ?? ''}
              placeholder={textoPadrao(selecionado.tipo)}
              onChange={e => setSelecionado((s: any) => ({ ...s, texto: e.target.value }))}
            />
          </Field>
          <div className="flex flex-wrap gap-5">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!selecionado.ativo} onChange={e => setSelecionado((s: any) => ({ ...s, ativo: e.target.checked }))} />
              Ativo
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!selecionado.padrao} onChange={e => setSelecionado((s: any) => ({ ...s, padrao: e.target.checked }))} />
              Modelo padrão
            </label>
          </div>
          <div className="flex justify-between">
            {selecionado.id ? (
              <Button variant="danger" onClick={excluir}><Trash2 className="h-4 w-4" /> Excluir</Button>
            ) : <div />}
            <Button onClick={salvar} disabled={salvando || !selecionado.nome}>
              <Save className="h-4 w-4" /> {salvando ? 'Salvando...' : 'Salvar modelo'}
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

function textoPadrao(tipo: string) {
  if (tipo === 'tcle') {
    return 'Declaro que recebi informações claras sobre os procedimentos da avaliação, seus objetivos, possíveis desconfortos e limites. Minha participação é voluntária e posso retirar meu consentimento a qualquer momento.';
  }
  return 'Declaro que fui informado(a) sobre os procedimentos da avaliação fisiometabólica, compreendi seus objetivos e autorizo a realização dos testes descritos pelo avaliador responsável.';
}
