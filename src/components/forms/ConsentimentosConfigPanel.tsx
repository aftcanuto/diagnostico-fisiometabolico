'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select } from '@/components/ui/Input';
import { FileCheck, Plus, Save, Trash2 } from 'lucide-react';
import { RichTextEditor } from '@/components/RichTextEditor';
import { getRichTextHtml } from '@/lib/safe-rich-text';

const MODELO_VAZIO = {
  tipo: 'consentimento_informado',
  nome: '',
  descricao: '',
  texto: '',
  texto_html: '',
  cor_destaque: '#047857',
  fonte: 'inter',
  tamanho_texto: 'medio',
  ativo: true,
  padrao: false,
};

export function ConsentimentosConfigPanel({ clinicaId }: { clinicaId: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [modelos, setModelos] = useState<any[]>([]);
  const [selecionado, setSelecionado] = useState<any>(MODELO_VAZIO);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setErro(null);
    const { data, error } = await supabase
      .from('consentimento_modelos')
      .select('*')
      .eq('clinica_id', clinicaId)
      .order('padrao', { ascending: false })
      .order('nome');
    if (error) {
      setErro(`Não foi possível carregar os modelos: ${error.message}`);
      setModelos([]);
      return;
    }
    setModelos(data ?? []);
  }, [clinicaId, supabase]);

  useEffect(() => { carregar(); }, [carregar]);

  async function salvar() {
    setSalvando(true);
    setErro(null);
    const payload = {
      ...selecionado,
      clinica_id: clinicaId,
      tipo: normalizarTipo(selecionado.tipo),
      texto: selecionado.texto || textoPadrao(selecionado.tipo),
      texto_html: selecionado.texto_html || null,
    };
    const query = selecionado.id
      ? supabase.from('consentimento_modelos').update(payload).eq('id', selecionado.id)
      : supabase.from('consentimento_modelos').insert(payload);
    const { error } = await query;
    setSalvando(false);
    if (error) {
      setErro(`Não foi possível salvar o modelo: ${error.message}`);
      return;
    }
    setSelecionado(MODELO_VAZIO);
    carregar();
  }

  async function excluir() {
    if (!selecionado.id || !confirm('Excluir este modelo?')) return;
    const { error } = await supabase.from('consentimento_modelos').delete().eq('id', selecionado.id);
    if (error) {
      setErro(`Não foi possível excluir o modelo: ${error.message}`);
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
          {erro && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {erro}
            </div>
          )}
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
            <RichTextEditor value={selecionado.texto_html || textoParaHtml(selecionado.texto || textoPadrao(selecionado.tipo))} onChange={html => setSelecionado((s: any) => ({ ...s, texto_html: html, texto: htmlParaTexto(html) }))} />
          </Field>
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Cor de destaque"><Input type="color" value={selecionado.cor_destaque || '#047857'} onChange={e => setSelecionado((s: any) => ({ ...s, cor_destaque: e.target.value }))} /></Field>
            <Field label="Fonte"><Select value={selecionado.fonte || 'inter'} onChange={e => setSelecionado((s: any) => ({ ...s, fonte: e.target.value }))}><option value="inter">Inter</option><option value="arial">Arial</option><option value="georgia">Georgia</option></Select></Field>
            <Field label="Tamanho"><Select value={selecionado.tamanho_texto || 'medio'} onChange={e => setSelecionado((s: any) => ({ ...s, tamanho_texto: e.target.value }))}><option value="pequeno">Pequeno</option><option value="medio">Médio</option><option value="grande">Grande</option></Select></Field>
          </div>
          <PreviewDocumento selecionado={selecionado} />
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


function normalizarTipo(tipo: string) {
  if (tipo === 'tcle') return 'tcle';
  if (tipo === 'uso_imagem') return 'uso_imagem';
  if (tipo === 'consentimento') return 'consentimento_informado';
  return 'consentimento_informado';
}

function PreviewDocumento({ selecionado }: { selecionado: any }) {
  const cor = /^#[0-9a-f]{6}$/i.test(selecionado.cor_destaque ?? '') ? selecionado.cor_destaque : '#047857';
  const fontFamily = selecionado.fonte === 'georgia' ? 'Georgia, serif' : selecionado.fonte === 'arial' ? 'Arial, sans-serif' : 'Inter, Arial, sans-serif';
  const fontSize = selecionado.tamanho_texto === 'pequeno' ? '13px' : selecionado.tamanho_texto === 'grande' ? '16px' : '14px';
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Prévia do documento</div>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm" style={{ fontFamily, fontSize }}>
        <div className="p-4 text-white" style={{ background: `linear-gradient(135deg, ${cor}, ${cor}cc)` }}>
          <div className="text-[10px] font-semibold uppercase tracking-[.2em] opacity-80">MedFit Saúde e Bem-estar</div>
          <div className="mt-1 text-xl font-bold">{selecionado.nome || 'Nome do termo'}</div>
          {selecionado.descricao && <div className="mt-1 text-xs opacity-85">{selecionado.descricao}</div>}
        </div>
        <div className={RICH_PREVIEW_CLASS} dangerouslySetInnerHTML={{ __html: getRichTextHtml(selecionado.texto_html, selecionado.texto || textoPadrao(selecionado.tipo)) }} />
      </div>
    </div>
  );
}

function textoParaHtml(texto: string) {
  return String(texto || '').split(/\r?\n/).map(linha => linha ? `<p>${linha.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>` : '<p><br></p>').join('');
}

function htmlParaTexto(html: string) {
  return html.replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|h1|h2|h3|li)>/gi, '\n').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
}

const RICH_PREVIEW_CLASS = 'rich-text p-4 leading-6 text-slate-600 [&_h1]:text-xl [&_h1]:font-bold [&_h2]:text-lg [&_h2]:font-bold [&_h3]:font-bold [&_li]:my-1 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-1 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6';
