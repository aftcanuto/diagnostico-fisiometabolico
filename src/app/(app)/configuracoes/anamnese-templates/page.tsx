'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select } from '@/components/ui/Input';
import { Plus, Trash2, GripVertical, Star, StarOff, ChevronDown, ChevronUp, Copy } from 'lucide-react';

type TipoCampo = 'texto' | 'texto_longo' | 'boolean' | 'numero' | 'escala' | 'selecao' | 'data' | 'secao';

interface Campo {
  id: string;
  tipo: TipoCampo;
  label: string;
  obrigatorio: boolean;
  opcoes?: string[];
  unidade?: string;
  placeholder?: string;
}

interface Template {
  id: string;
  nome: string;
  descricao: string;
  campos: Campo[];
  padrao: boolean;
  ativo: boolean;
}

const TIPO_LABELS: Record<TipoCampo, string> = {
  texto:      'Texto curto',
  texto_longo:'Texto longo',
  boolean:    'Sim / Não',
  numero:     'Número',
  escala:     'Escala 1–10',
  selecao:    'Seleção múltipla',
  data:       'Data',
  secao:      'Título de seção',
};

const TEMPLATE_PADRAO: Omit<Template, 'id'> = {
  nome: 'Geral',
  descricao: 'Template padrão para avaliação fisiometabólica',
  padrao: true,
  ativo: true,
  campos: [
    { id: 'queixa', tipo: 'texto_longo', label: 'Queixa principal', obrigatorio: true },
    { id: 'historia', tipo: 'texto_longo', label: 'História da doença atual', obrigatorio: false },
    { id: 'sec_medico', tipo: 'secao', label: 'Histórico médico', obrigatorio: false },
    { id: 'hipertensao', tipo: 'boolean', label: 'Hipertensão arterial', obrigatorio: false },
    { id: 'diabetes', tipo: 'boolean', label: 'Diabetes', obrigatorio: false },
    { id: 'cardiopatia', tipo: 'boolean', label: 'Cardiopatia', obrigatorio: false },
    { id: 'medicamentos', tipo: 'texto_longo', label: 'Medicamentos em uso', obrigatorio: false },
    { id: 'cirurgias', tipo: 'texto', label: 'Cirurgias anteriores', obrigatorio: false },
    { id: 'alergias', tipo: 'texto', label: 'Alergias', obrigatorio: false },
    { id: 'sec_habitos', tipo: 'secao', label: 'Hábitos de vida', obrigatorio: false },
    { id: 'tabagismo', tipo: 'boolean', label: 'Tabagismo', obrigatorio: false },
    { id: 'alcool', tipo: 'selecao', label: 'Consumo de álcool', obrigatorio: false, opcoes: ['Não consome', 'Social (1-2x/semana)', 'Regular (3-4x/semana)', 'Diário'] },
    { id: 'sono', tipo: 'numero', label: 'Horas de sono por noite', obrigatorio: false, unidade: 'h' },
    { id: 'estresse', tipo: 'escala', label: 'Nível de estresse (1=baixo, 10=alto)', obrigatorio: false },
    { id: 'hidratacao', tipo: 'numero', label: 'Consumo de água por dia', obrigatorio: false, unidade: 'L' },
    { id: 'sec_atividade', tipo: 'secao', label: 'Atividade física', obrigatorio: false },
    { id: 'tipo_exercicio', tipo: 'texto', label: 'Tipo de exercício praticado', obrigatorio: false },
    { id: 'freq_semanal', tipo: 'numero', label: 'Frequência semanal', obrigatorio: false, unidade: 'dias/sem' },
    { id: 'tempo_sessao', tipo: 'numero', label: 'Duração da sessão', obrigatorio: false, unidade: 'min' },
    { id: 'historia_familiar', tipo: 'texto_longo', label: 'História familiar', obrigatorio: false },
    { id: 'objetivos', tipo: 'texto_longo', label: 'Objetivos', obrigatorio: true },
  ],
};

function novoCampo(): Campo {
  return { id: crypto.randomUUID(), tipo: 'texto', label: '', obrigatorio: false };
}

export default function AnamneseTemplatesPage() {
  const supabase = createClient();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [editando, setEditando]   = useState<Template | null>(null);
  const [loading, setLoading]     = useState(true);
  const [salvando, setSalvando]   = useState(false);
  const [expandidos, setExpandidos] = useState<Record<string, boolean>>({});

  async function carregar() {
    setLoading(true);
    const { data } = await supabase.from('anamnese_templates').select('*').order('created_at');
    setTemplates(data ?? []);
    setLoading(false);
  }

  useEffect(() => { carregar(); }, []);

  async function salvar() {
    if (!editando) return;
    setSalvando(true);
    if (editando.id) {
      await supabase.from('anamnese_templates')
        .update({ nome: editando.nome, descricao: editando.descricao,
          campos: editando.campos, ativo: editando.ativo })
        .eq('id', editando.id);
    } else {
      await supabase.from('anamnese_templates')
        .insert({ nome: editando.nome, descricao: editando.descricao,
          campos: editando.campos, padrao: editando.padrao, ativo: editando.ativo });
    }
    setSalvando(false);
    setEditando(null);
    carregar();
  }

  async function definirPadrao(id: string) {
    await supabase.from('anamnese_templates').update({ padrao: false }).neq('id', id);
    await supabase.from('anamnese_templates').update({ padrao: true }).eq('id', id);
    carregar();
  }

  async function excluir(id: string) {
    if (!confirm('Excluir este template?')) return;
    await supabase.from('anamnese_templates').delete().eq('id', id);
    carregar();
  }

  function novoTemplate() {
    setEditando({ ...TEMPLATE_PADRAO, id: '' } as Template);
  }

  function duplicar(t: Template) {
    setEditando({ ...t, id: '', nome: t.nome + ' (cópia)', padrao: false });
  }

  function updCampo(i: number, field: keyof Campo, val: any) {
    if (!editando) return;
    const campos = [...editando.campos];
    (campos[i] as any)[field] = val;
    setEditando({ ...editando, campos });
  }

  function addCampo() {
    if (!editando) return;
    setEditando({ ...editando, campos: [...editando.campos, novoCampo()] });
  }

  function rmCampo(i: number) {
    if (!editando) return;
    setEditando({ ...editando, campos: editando.campos.filter((_, j) => j !== i) });
  }

  if (loading) return <p className="text-slate-500 p-4">Carregando…</p>;

  if (editando) {
    return (
      <div className="max-w-3xl space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">
            {editando.id ? 'Editar template' : 'Novo template'}
          </h2>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setEditando(null)}>Cancelar</Button>
            <Button onClick={salvar} disabled={salvando}>
              {salvando ? 'Salvando…' : 'Salvar template'}
            </Button>
          </div>
        </div>

        <Card>
          <CardBody className="space-y-4">
            <Field label="Nome do template">
              <Input value={editando.nome} onChange={e => setEditando({ ...editando, nome: e.target.value })} />
            </Field>
            <Field label="Descrição (opcional)">
              <Input value={editando.descricao}
                onChange={e => setEditando({ ...editando, descricao: e.target.value })} />
            </Field>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={editando.ativo}
                onChange={e => setEditando({ ...editando, ativo: e.target.checked })}
                className="w-4 h-4 accent-brand-600" />
              <span className="text-sm text-slate-700">Template ativo (aparece na seleção)</span>
            </label>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Campos do formulário ({editando.campos.length})</CardTitle>
              <Button size="sm" onClick={addCampo}><Plus className="w-3 h-3" /> Adicionar campo</Button>
            </div>
          </CardHeader>
          <CardBody className="space-y-3">
            {editando.campos.map((campo, i) => (
              <div key={campo.id}
                className={`rounded-lg border p-3 ${campo.tipo === 'secao' ? 'bg-brand-50 border-brand-200' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-start gap-3">
                  <GripVertical className="w-4 h-4 text-slate-300 mt-2 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2">
                        <Input value={campo.label} placeholder="Rótulo do campo"
                          onChange={e => updCampo(i, 'label', e.target.value)} />
                      </div>
                      <Select value={campo.tipo} onChange={e => updCampo(i, 'tipo', e.target.value as TipoCampo)}>
                        {(Object.entries(TIPO_LABELS) as [TipoCampo, string][]).map(([v, l]) => (
                          <option key={v} value={v}>{l}</option>
                        ))}
                      </Select>
                    </div>
                    {campo.tipo === 'numero' && (
                      <Input value={campo.unidade ?? ''} placeholder="Unidade (ex: kg, L, anos)"
                        onChange={e => updCampo(i, 'unidade', e.target.value)} className="w-40" />
                    )}
                    {campo.tipo === 'selecao' && (
                      <textarea value={(campo.opcoes ?? []).join('\n')}
                        placeholder="Uma opção por linha"
                        onChange={e => updCampo(i, 'opcoes', e.target.value.split('\n'))}
                        rows={3} className="w-full text-sm border border-slate-200 rounded p-2 resize-none" />
                    )}
                    {campo.tipo !== 'secao' && (
                      <label className="flex items-center gap-2 text-xs cursor-pointer">
                        <input type="checkbox" checked={campo.obrigatorio}
                          onChange={e => updCampo(i, 'obrigatorio', e.target.checked)}
                          className="accent-brand-600" />
                        Campo obrigatório
                      </label>
                    )}
                  </div>
                  <button onClick={() => rmCampo(i)} className="p-1 text-slate-300 hover:text-red-500 transition flex-shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Formulários de anamnese</h1>
          <p className="text-sm text-slate-500 mt-1">
            Crie formulários personalizados para diferentes objetivos de avaliação
          </p>
        </div>
        <Button onClick={novoTemplate}><Plus className="w-4 h-4" /> Novo template</Button>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12">
            <p className="text-slate-400 mb-4">Nenhum template cadastrado.</p>
            <Button onClick={novoTemplate}>Criar primeiro template</Button>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {templates.map(t => (
            <Card key={t.id} className={t.padrao ? 'border-brand-300 ring-1 ring-brand-200' : ''}>
              <CardBody>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800">{t.nome}</span>
                      {t.padrao && (
                        <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-medium">
                          Padrão
                        </span>
                      )}
                      {!t.ativo && (
                        <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                          Inativo
                        </span>
                      )}
                    </div>
                    {t.descricao && <p className="text-sm text-slate-500 mt-1">{t.descricao}</p>}
                    <p className="text-xs text-slate-400 mt-1">{t.campos.length} campos</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {!t.padrao && (
                      <Button size="sm" variant="ghost" title="Definir como padrão"
                        onClick={() => definirPadrao(t.id)}>
                        <StarOff className="w-3.5 h-3.5 text-slate-400" />
                      </Button>
                    )}
                    {t.padrao && (
                      <Button size="sm" variant="ghost" title="Template padrão">
                        <Star className="w-3.5 h-3.5 text-amber-500" />
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => duplicar(t)}>
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => setEditando(t)}>
                      Editar
                    </Button>
                    {!t.padrao && (
                      <Button size="sm" variant="ghost" onClick={() => excluir(t.id)}>
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
