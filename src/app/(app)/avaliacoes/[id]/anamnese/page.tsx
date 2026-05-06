'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Field, Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { SaveIndicator } from '@/components/ui/SaveIndicator';
import { useAutoSave } from '@/lib/useAutoSave';
import { buildSteps } from '@/lib/steps';
import { buscarModulo, upsertModulo } from '@/lib/modulos';

// ─── Tipos ───────────────────────────────────────────────────────────────────
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
  campos: Campo[];
}

function textoSeguro(valor: any, fallback = ''): string {
  if (valor == null || valor === '') return fallback;
  if (typeof valor === 'string' || typeof valor === 'number' || typeof valor === 'boolean') return String(valor);
  if (Array.isArray(valor)) return textoSeguro(valor[0], fallback);
  if (typeof valor === 'object') return textoSeguro(valor.label ?? valor.nome ?? valor.valor ?? valor.id, fallback);
  return fallback;
}

function valorInput(valor: any): any {
  if (valor == null) return '';
  if (typeof valor === 'object') return textoSeguro(valor);
  return valor;
}

// ─── Renderizador de campo dinâmico ─────────────────────────────────────────
function CampoDinamico({ campo, valor, onChange }: {
  campo: Campo;
  valor: any;
  onChange: (v: any) => void;
}) {
  const campoLabel = textoSeguro(campo.label, 'Campo');
  const campoPlaceholder = textoSeguro(campo.placeholder);
  const campoUnidade = textoSeguro(campo.unidade);
  if (typeof valor === 'object') valor = textoSeguro(valor);
  // Título de seção
  if (campo.tipo === 'secao') {
    return (
      <div className="col-span-2 pt-4 pb-1 border-b border-slate-200">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{campoLabel}</h3>
      </div>
    );
  }

  const label = campoLabel + (campo.obrigatorio ? ' *' : '');

  if (campo.tipo === 'texto_longo') {
    return (
      <div className="col-span-2">
        <Field label={label}>
          <Textarea value={valorInput(valor)} onChange={e => onChange(e.target.value)}
            placeholder={campoPlaceholder} />
        </Field>
      </div>
    );
  }

  if (campo.tipo === 'texto') {
    return (
      <Field label={label}>
        <Input value={valorInput(valor)} onChange={e => onChange(e.target.value)}
          placeholder={campoPlaceholder} />
      </Field>
    );
  }

  if (campo.tipo === 'boolean') {
    return (
      <Field label={label}>
        <select className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm bg-white"
          value={valor === true ? 'sim' : valor === false ? 'nao' : ''}
          onChange={e => onChange(e.target.value === 'sim' ? true : e.target.value === 'nao' ? false : null)}>
          <option value="">— Selecione —</option>
          <option value="sim">Sim</option>
          <option value="nao">Não</option>
        </select>
      </Field>
    );
  }

  if (campo.tipo === 'numero') {
    return (
      <Field label={`${label}${campoUnidade ? ` (${campoUnidade})` : ''}`}>
        <Input type="number" value={typeof valor === 'object' ? '' : valor ?? ''} onChange={e => onChange(e.target.value === '' ? null : Number(e.target.value))}
          placeholder={campoPlaceholder} />
      </Field>
    );
  }

  if (campo.tipo === 'escala') {
    return (
      <Field label={label}>
        <div className="flex items-center gap-2">
          <input type="range" min={1} max={10} step={1}
            value={typeof valor === 'object' ? 5 : valor ?? 5}
            onChange={e => onChange(Number(e.target.value))}
            className="flex-1 accent-brand-600" />
          <span className="w-8 text-center font-bold text-brand-700 text-lg">{valor ?? '—'}</span>
        </div>
        <div className="flex justify-between text-xs text-slate-400 mt-1">
          <span>1 (mínimo)</span><span>10 (máximo)</span>
        </div>
      </Field>
    );
  }

  if (campo.tipo === 'selecao') {
    const opcoes = Array.isArray(campo.opcoes) ? campo.opcoes.map(op => textoSeguro(op)).filter(Boolean) : [];
    return (
      <Field label={label}>
        <select className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm bg-white"
          value={valorInput(valor)}
          onChange={e => onChange(e.target.value)}>
          <option value="">— Selecione —</option>
          {opcoes.map(op => <option key={op} value={op}>{op}</option>)}
        </select>
      </Field>
    );
  }

  if (campo.tipo === 'data') {
    return (
      <Field label={label}>
        <Input type="date" value={valorInput(valor)} onChange={e => onChange(e.target.value)} />
      </Field>
    );
  }

  return null;
}

// ─── Fallback: anamnese básica sem template ──────────────────────────────────
function AnamnesesFallback({ respostas, onChange }: { respostas: any; onChange: (k: string, v: any) => void }) {
  return (
    <>
      <Card>
        <CardHeader><CardTitle>Queixa & objetivos</CardTitle></CardHeader>
        <CardBody className="space-y-4">
          <Field label="Queixa principal">
            <Textarea value={respostas.queixa_principal ?? ''} onChange={e => onChange('queixa_principal', e.target.value)} />
          </Field>
          <Field label="Objetivos">
            <Textarea value={respostas.objetivos ?? ''} onChange={e => onChange('objetivos', e.target.value)} />
          </Field>
        </CardBody>
      </Card>
      <Card>
        <CardHeader><CardTitle>Atividade física</CardTitle></CardHeader>
        <CardBody className="grid grid-cols-2 gap-4">
          <Field label="Tipo de atividade">
            <Input value={respostas.tipo_atividade ?? ''} onChange={e => onChange('tipo_atividade', e.target.value)} />
          </Field>
          <Field label="Frequência (dias/sem)">
            <Input type="number" min={0} max={7} value={respostas.freq_semanal ?? ''} onChange={e => onChange('freq_semanal', e.target.value)} />
          </Field>
        </CardBody>
      </Card>
    </>
  );
}

// ─── Página principal ────────────────────────────────────────────────────────
export default function AnamnesePage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const router = useRouter();

  const [template, setTemplate] = useState<Template | null>(null);
  const [respostas, setRespostas] = useState<Record<string, any>>({});
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [aval, setAval] = useState<any>(null);

  useEffect(() => {
    (async () => {
      // 1. Buscar avaliação para saber a clínica e modulos
      const { data: av } = await supabase.from('avaliacoes')
        .select('modulos_selecionados, clinica_id')
        .eq('id', params.id)
        .single();
      setAval(av);

      // 2. Buscar dados salvos de anamnese
      const an = await buscarModulo('anamnese', params.id);

      // 3. Buscar template da clínica (padrão ou o salvo na anamnese)
      const clinicaId = av?.clinica_id;
      let tpl: Template | null = null;

      if (clinicaId) {
        // Usar template_id salvo, ou buscar o padrão
        const templateBuscaId = an?.template_id;
        if (templateBuscaId) {
          const { data: t } = await supabase.from('anamnese_templates')
            .select('id, nome, campos').eq('id', templateBuscaId).single();
          tpl = t ?? null;
        }
        if (!tpl) {
          // Pegar template padrão da clínica
          const { data: t } = await supabase.from('anamnese_templates')
            .select('id, nome, campos')
            .eq('clinica_id', clinicaId)
            .eq('padrao', true)
            .eq('ativo', true)
            .maybeSingle();
          tpl = t ?? null;
        }
        if (!tpl) {
          // Qualquer template ativo
          const { data: t } = await supabase.from('anamnese_templates')
            .select('id, nome, campos')
            .eq('clinica_id', clinicaId)
            .eq('ativo', true)
            .order('created_at')
            .limit(1)
            .maybeSingle();
          tpl = t ?? null;
        }
      }

      setTemplate(tpl);
      setTemplateId(tpl?.id ?? null);

      // 4. Preencher respostas salvas
      if (an?.respostas) {
        setRespostas(an.respostas);
      } else if (an) {
        // Compatibilidade com anamnese antiga (campos diretos)
        const { template_id, respostas: r, avaliacao_id, updated_at, ...campos } = an;
        setRespostas(r ?? campos);
      }

      setLoaded(true);
    })();
  }, [params.id]);

  async function salvarAnamnese(v = { respostas, template_id: templateId }) {
    if (!loaded) return;
    await upsertModulo('anamnese', params.id, {
      respostas: v.respostas,
      template_id: v.template_id,
    });
  }

  // AutoSave
  const payload = { respostas, template_id: templateId };
  const saveState = useAutoSave(payload, salvarAnamnese);

  const setResp = (id: string, val: any) =>
    setRespostas(prev => ({ ...prev, [id]: val }));

  // Navegação
  const steps = aval ? buildSteps(params.id, aval.modulos_selecionados) : [];
  const idx = steps.findIndex(s => s.key === 'anamnese');
  const next = steps[idx + 1];

  // ── Render ──────────────────────────────────────────────────────────────────
  if (!loaded) return <p className="text-slate-400">Carregando formulário…</p>;

  return (
    <div className="space-y-5 max-w-4xl">

      {/* Sem template: usar fallback básico */}
      {!template && (
        <>
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
            Nenhum formulário de anamnese configurado para esta clínica.{' '}
            <a href="/configuracoes/anamnese-templates" className="font-semibold underline">
              Criar agora →
            </a>
          </div>
          <AnamnesesFallback respostas={respostas} onChange={setResp} />
        </>
      )}

      {/* Com template: renderizar campos dinâmicos agrupados em cards por seção */}
      {template && (() => {
        // Agrupar campos em seções
        type Grupo = { titulo: string | null; campos: Campo[] };
        const grupos: Grupo[] = [];
        let grupoAtual: Grupo = { titulo: null, campos: [] };

        for (const campo of (Array.isArray(template.campos) ? template.campos : [])) {
          if (campo.tipo === 'secao') {
            if (grupoAtual.campos.length > 0 || grupoAtual.titulo) {
              grupos.push(grupoAtual);
            }
            grupoAtual = { titulo: textoSeguro(campo.label, 'Seção'), campos: [] };
          } else {
            grupoAtual.campos.push(campo);
          }
        }
        if (grupoAtual.campos.length > 0 || grupoAtual.titulo) {
          grupos.push(grupoAtual);
        }

        return grupos.map((grupo, gi) => (
          <Card key={gi}>
            {grupo.titulo && (
              <CardHeader>
                <CardTitle>{grupo.titulo}</CardTitle>
              </CardHeader>
            )}
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {grupo.campos.map(campo => (
                  <CampoDinamico
                    key={textoSeguro(campo.id, `campo-${gi}`)}
                    campo={campo}
                    valor={respostas[campo.id]}
                    onChange={v => setResp(campo.id, v)}
                  />
                ))}
              </div>
            </CardBody>
          </Card>
        ));
      })()}

      <div className="flex justify-end">
        <Button onClick={async () => {
          await salvarAnamnese();
          if (next) router.push(next.href);
        }}>
          Continuar →
        </Button>
      </div>
      <SaveIndicator state={saveState} />
    </div>
  );
}
