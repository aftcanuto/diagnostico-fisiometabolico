'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select, Textarea } from '@/components/ui/Input';
import { BrainCircuit, Plus, Save, Sparkles, Trash2 } from 'lucide-react';

const MODULOS = [
  { value: 'anamnese', label: 'Anamnese' },
  { value: 'sinais_vitais', label: 'Sinais vitais' },
  { value: 'posturografia', label: 'Posturografia' },
  { value: 'termografia', label: 'Termografia funcional' },
  { value: 'antropometria', label: 'Antropometria' },
  { value: 'bioimpedancia', label: 'Bioimpedância' },
  { value: 'forca', label: 'Força' },
  { value: 'flexibilidade', label: 'Flexibilidade' },
  { value: 'rml', label: 'RML' },
  { value: 'cardiorrespiratorio', label: 'Cardiorrespiratório' },
  { value: 'biomecanica_corrida', label: 'Biomecânica da corrida' },
];

const VAZIO = {
  modulo: 'anamnese',
  titulo: '',
  condicao_uso: '',
  interpretacao: '',
  riscos: '',
  recomendacoes: '',
  ativo: true,
  ordem: 0,
};

const MODELOS_PADRAO = [
  {
    modulo: 'anamnese',
    titulo: 'Fatores de risco modificáveis',
    condicao_uso: 'Usar quando houver sedentarismo, sono inadequado, alimentação irregular, estresse elevado ou histórico clínico relevante.',
    interpretacao: 'A anamnese sugere fatores comportamentais e clínicos que podem interferir diretamente na composição corporal, desempenho físico e recuperação. Esses pontos devem ser considerados na priorização das condutas, pois podem limitar a resposta ao treinamento mesmo quando os testes físicos apresentam boa execução.',
    riscos: 'Baixa adesão ao plano, recuperação insuficiente, piora de sintomas pré-existentes e menor resposta ao treinamento.',
    recomendacoes: 'Priorizar ajustes graduais de rotina, sono, hidratação, alimentação e controle de carga. Encaminhar para avaliação médica, nutricional ou fisioterapêutica quando houver sintomas persistentes, dor, uso de medicação relevante ou sinais clínicos de atenção.',
  },
  {
    modulo: 'sinais_vitais',
    titulo: 'Resposta cardiovascular em atenção',
    condicao_uso: 'Usar quando pressão arterial, frequência cardíaca de repouso, SpO2 ou recuperação estiverem fora do esperado.',
    interpretacao: 'Os sinais vitais indicam necessidade de atenção ao estado cardiovascular e autonômico no momento da avaliação. A interpretação deve considerar repouso, ansiedade, sono, hidratação, uso de estimulantes, medicações e histórico clínico.',
    riscos: 'Maior risco de intolerância ao esforço, resposta cardiovascular exagerada e necessidade de controle clínico antes de intensificar treino.',
    recomendacoes: 'Monitorar sinais vitais em novas sessões, iniciar com intensidade conservadora e orientar avaliação médica quando os achados forem persistentes, sintomáticos ou incompatíveis com segurança para esforço.',
  },
  {
    modulo: 'antropometria',
    titulo: 'Composição corporal com margem de melhora',
    condicao_uso: 'Usar quando houver percentual de gordura elevado, massa magra abaixo do potencial ou relação cintura/quadril em atenção.',
    interpretacao: 'A antropometria demonstra uma composição corporal com margem relevante de evolução. A análise deve integrar percentual de gordura, massa magra, circunferências, somatotipo e objetivo do paciente, evitando conclusões isoladas por um único indicador.',
    riscos: 'Risco de estagnação estética e funcional, menor eficiência metabólica e pior resposta ao treinamento quando a massa magra ou o controle de gordura corporal estiverem desfavoráveis.',
    recomendacoes: 'Combinar treino de força progressivo, controle nutricional individualizado e acompanhamento periódico das medidas. Reavaliar em ciclo definido para confirmar tendência, não apenas variação pontual.',
  },
  {
    modulo: 'bioimpedancia',
    titulo: 'Assimetria ou distribuição corporal alterada',
    condicao_uso: 'Usar quando houver desequilíbrio segmentar, gordura visceral elevada, hidratação alterada ou massa muscular reduzida.',
    interpretacao: 'A bioimpedância complementa a avaliação antropométrica ao mostrar distribuição de massa magra, gordura, água corporal e possíveis assimetrias segmentares. Alterações nesses marcadores podem indicar desequilíbrios funcionais, metabólicos ou necessidade de ajuste na estratégia de treino e nutrição.',
    riscos: 'Sobrecarga unilateral, baixa eficiência metabólica, maior dificuldade de recomposição corporal e risco de interpretação imprecisa quando hidratação e preparo pré-teste não foram adequados.',
    recomendacoes: 'Controlar condições pré-teste, comparar com medidas antropométricas e usar a evolução longitudinal como principal referência. Direcionar treino e nutrição conforme o padrão segmentar e objetivo do paciente.',
  },
  {
    modulo: 'posturografia',
    titulo: 'Compensações posturais relevantes',
    condicao_uso: 'Usar quando houver assimetria de ombros, cabeça anteriorizada, alterações pélvicas, desvios de joelho, pés ou coluna.',
    interpretacao: 'A posturografia evidencia compensações que podem alterar a distribuição de carga, mobilidade e eficiência de movimento. Esses achados não devem ser vistos isoladamente, mas integrados à dor, força, flexibilidade e biomecânica.',
    riscos: 'Maior tendência a sobrecarga mecânica, restrição de mobilidade, queda de eficiência técnica e manutenção de padrões compensatórios durante treino ou corrida.',
    recomendacoes: 'Priorizar mobilidade, controle motor, fortalecimento específico e reeducação de padrões. Reavaliar após período de intervenção para verificar redução das compensações.',
  },
  {
    modulo: 'forca',
    titulo: 'Déficit ou assimetria de força',
    condicao_uso: 'Usar quando força relativa, preensão, dinamometria específica, LSI ou assimetria estiverem abaixo do esperado.',
    interpretacao: 'A avaliação de força indica capacidade neuromuscular e possíveis assimetrias entre segmentos. Déficits relevantes podem limitar performance, estabilidade articular e tolerância à carga, especialmente quando associados a dor ou histórico de lesão.',
    riscos: 'Maior risco de compensações, sobrecarga unilateral, queda de desempenho e dificuldade para progressão segura de intensidade.',
    recomendacoes: 'Utilizar progressão de força planejada, controle de assimetria, exercícios unilaterais quando indicado e reteste para acompanhar resposta. Evitar aumento abrupto de carga quando houver déficit importante.',
  },
  {
    modulo: 'flexibilidade',
    titulo: 'Restrição de mobilidade funcional',
    condicao_uso: 'Usar quando Banco de Wells, amplitude articular ou observações indicarem encurtamento/restrição.',
    interpretacao: 'A flexibilidade avaliada sugere o grau de mobilidade disponível para execução de movimentos funcionais e esportivos. Restrições podem interferir na postura, técnica, economia de movimento e tolerância a determinados exercícios.',
    riscos: 'Compensações lombopélvicas, menor eficiência técnica, desconfortos recorrentes e maior dificuldade em padrões que exigem amplitude.',
    recomendacoes: 'Associar alongamentos, mobilidade ativa, controle motor e fortalecimento em amplitude. Ajustar exercícios conforme tolerância e reavaliar periodicamente.',
  },
  {
    modulo: 'rml',
    titulo: 'Baixa resistência muscular localizada',
    condicao_uso: 'Usar quando testes de core, membros superiores ou inferiores indicarem resistência abaixo do esperado.',
    interpretacao: 'A resistência muscular localizada mostra a capacidade de sustentar esforço repetido com qualidade. Baixo desempenho em algum grupamento pode comprometer estabilidade, postura, tolerância ao treino e manutenção da técnica sob fadiga.',
    riscos: 'Fadiga precoce, compensações técnicas, pior sustentação postural e queda de performance em atividades prolongadas.',
    recomendacoes: 'Trabalhar endurance muscular de forma progressiva, com foco nos grupamentos de menor desempenho. Integrar core, membros superiores e inferiores conforme objetivo do paciente.',
  },
  {
    modulo: 'cardiorrespiratorio',
    titulo: 'Capacidade aeróbia abaixo do potencial',
    condicao_uso: 'Usar quando VO2max, limiar, VAM, recuperação de FC ou zonas de treino mostrarem baixa aptidão ou margem clara de evolução.',
    interpretacao: 'A avaliação cardiorrespiratória aponta o nível atual de aptidão aeróbia e a capacidade de sustentar esforço. Quando abaixo do esperado, pode limitar desempenho, recuperação e saúde metabólica.',
    riscos: 'Baixa tolerância ao esforço, recuperação lenta, maior percepção de fadiga e menor eficiência cardiovascular.',
    recomendacoes: 'Estruturar treino aeróbio por zonas, priorizando base em baixa intensidade e progressões controladas. Usar limiar, VAM e recuperação de FC para ajustar carga e acompanhar evolução.',
  },
  {
    modulo: 'biomecanica_corrida',
    titulo: 'Padrão biomecânico com sobrecarga',
    condicao_uso: 'Usar quando houver overstride, contato excessivo, assimetria, baixa cadência, alteração de tronco, pelve, joelho, tornozelo ou pé.',
    interpretacao: 'A análise biomecânica da corrida identifica padrões técnicos que podem reduzir economia de movimento e aumentar sobrecarga articular ou muscular. A interpretação deve integrar velocidade, contato com o solo, cadência, ângulos e achados clínicos.',
    riscos: 'Maior sobrecarga repetitiva, perda de eficiência, manutenção de compensações e possível aumento de sintomas em treinos com maior volume ou intensidade.',
    recomendacoes: 'Ajustar técnica de corrida de forma gradual, trabalhar força e controle motor específicos, revisar volume/intensidade e acompanhar resposta em nova análise.',
  },
];

export function ModelosInterpretacaoPanel({ clinicaId }: { clinicaId: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [itens, setItens] = useState<any[]>([]);
  const [selecionado, setSelecionado] = useState<any>(VAZIO);
  const [salvando, setSalvando] = useState(false);
  const [carregandoPadroes, setCarregandoPadroes] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setErro(null);
    const { data, error } = await supabase
      .from('modelos_interpretacao_modulos')
      .select('*')
      .eq('clinica_id', clinicaId)
      .order('modulo')
      .order('ordem')
      .order('titulo');

    if (error) {
      setErro(`Não foi possível carregar os modelos: ${error.message}`);
      setItens([]);
      return;
    }
    setItens(data ?? []);
  }, [clinicaId, supabase]);

  useEffect(() => { carregar(); }, [carregar]);

  async function salvar() {
    setSalvando(true);
    setErro(null);
    const payload = {
      ...selecionado,
      clinica_id: clinicaId,
      modulo: selecionado.modulo || 'anamnese',
      titulo: selecionado.titulo?.trim(),
      condicao_uso: selecionado.condicao_uso?.trim() || null,
      interpretacao: selecionado.interpretacao?.trim() || '',
      riscos: selecionado.riscos?.trim() || '',
      recomendacoes: selecionado.recomendacoes?.trim() || '',
      ordem: Number(selecionado.ordem || 0),
    };

    const query = selecionado.id
      ? supabase.from('modelos_interpretacao_modulos').update(payload).eq('id', selecionado.id)
      : supabase.from('modelos_interpretacao_modulos').insert(payload);

    const { error } = await query;
    setSalvando(false);
    if (error) {
      setErro(`Não foi possível salvar o modelo: ${error.message}`);
      return;
    }
    setSelecionado(VAZIO);
    carregar();
  }

  async function excluir() {
    if (!selecionado.id || !confirm('Excluir este modelo de interpretação?')) return;
    const { error } = await supabase
      .from('modelos_interpretacao_modulos')
      .delete()
      .eq('id', selecionado.id);

    if (error) {
      setErro(`Não foi possível excluir o modelo: ${error.message}`);
      return;
    }
    setSelecionado(VAZIO);
    carregar();
  }

  async function carregarModelosPadrao() {
    if (!confirm('Adicionar modelos-base para todos os módulos? Eles poderão ser editados depois.')) return;
    setCarregandoPadroes(true);
    setErro(null);
    const existentes = new Set(itens.map(item => `${item.modulo}:${normalizarTitulo(item.titulo)}`));
    const novos = MODELOS_PADRAO
      .filter(modelo => !existentes.has(`${modelo.modulo}:${normalizarTitulo(modelo.titulo)}`))
      .map((modelo, index) => ({
        ...modelo,
        clinica_id: clinicaId,
        ativo: true,
        ordem: index + 1,
      }));

    if (novos.length === 0) {
      setCarregandoPadroes(false);
      setErro('Os modelos-base já foram adicionados para esta clínica.');
      return;
    }

    const { error } = await supabase.from('modelos_interpretacao_modulos').insert(novos);
    setCarregandoPadroes(false);
    if (error) {
      setErro(`Não foi possível adicionar os modelos-base: ${error.message}`);
      return;
    }
    carregar();
  }

  const moduloAtual = MODULOS.find(m => m.value === selecionado.modulo)?.label ?? 'Módulo';

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <BrainCircuit className="inline h-4 w-4 mr-1 text-brand-600" />
          Modelos de interpretação por módulo
        </CardTitle>
      </CardHeader>
      <CardBody className="grid gap-5 lg:grid-cols-[280px,1fr]">
        <div className="space-y-2">
          <Button variant="secondary" className="w-full" onClick={() => setSelecionado(VAZIO)}>
            <Plus className="h-4 w-4" /> Novo modelo
          </Button>
          <Button variant="ghost" className="w-full border border-dashed border-brand-200 text-brand-700" onClick={carregarModelosPadrao} disabled={carregandoPadroes}>
            <Sparkles className="h-4 w-4" /> {carregandoPadroes ? 'Adicionando...' : 'Carregar modelos-base'}
          </Button>
          {itens.map(item => (
            <button
              key={item.id}
              onClick={() => setSelecionado({ ...VAZIO, ...item })}
              className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${selecionado.id === item.id ? 'border-brand-300 bg-brand-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
            >
              <div className="font-medium text-slate-800">{item.titulo}</div>
              <div className="mt-0.5 text-xs text-slate-500">
                {MODULOS.find(m => m.value === item.modulo)?.label ?? item.modulo} {!item.ativo ? '· inativo' : ''}
              </div>
            </button>
          ))}
          {itens.length === 0 && (
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
          <div className="grid gap-4 md:grid-cols-[1fr,1fr,120px]">
            <Field label="Módulo">
              <Select value={selecionado.modulo} onChange={e => setSelecionado((s: any) => ({ ...s, modulo: e.target.value }))}>
                {MODULOS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </Select>
            </Field>
            <Field label="Título do modelo">
              <Input value={selecionado.titulo ?? ''} onChange={e => setSelecionado((s: any) => ({ ...s, titulo: e.target.value }))} placeholder="Ex.: VO2 abaixo do esperado" />
            </Field>
            <Field label="Ordem">
              <Input type="number" value={selecionado.ordem ?? 0} onChange={e => setSelecionado((s: any) => ({ ...s, ordem: e.target.value }))} />
            </Field>
          </div>

          <Field label="Quando usar este modelo" hint="Ex.: score abaixo de 60, assimetria relevante, VO2 baixo, gordura visceral elevada.">
            <Input value={selecionado.condicao_uso ?? ''} onChange={e => setSelecionado((s: any) => ({ ...s, condicao_uso: e.target.value }))} />
          </Field>

          <Field label="Interpretação padrão">
            <Textarea className="min-h-[120px]" value={selecionado.interpretacao ?? ''} onChange={e => setSelecionado((s: any) => ({ ...s, interpretacao: e.target.value }))} />
          </Field>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Riscos e pontos de atenção">
              <Textarea className="min-h-[110px]" value={selecionado.riscos ?? ''} onChange={e => setSelecionado((s: any) => ({ ...s, riscos: e.target.value }))} />
            </Field>
            <Field label="Recomendações">
              <Textarea className="min-h-[110px]" value={selecionado.recomendacoes ?? ''} onChange={e => setSelecionado((s: any) => ({ ...s, recomendacoes: e.target.value }))} />
            </Field>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Prévia para a IA</div>
            <div className="text-sm text-slate-700">
              <div><b>{moduloAtual}</b> · {selecionado.titulo || 'Título do modelo'}</div>
              {selecionado.condicao_uso && <div className="mt-1"><b>Uso:</b> {selecionado.condicao_uso}</div>}
              {selecionado.interpretacao && <div className="mt-2 whitespace-pre-wrap"><b>Interpretação:</b> {selecionado.interpretacao}</div>}
              {selecionado.riscos && <div className="mt-2 whitespace-pre-wrap"><b>Riscos:</b> {selecionado.riscos}</div>}
              {selecionado.recomendacoes && <div className="mt-2 whitespace-pre-wrap"><b>Recomendações:</b> {selecionado.recomendacoes}</div>}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={!!selecionado.ativo} onChange={e => setSelecionado((s: any) => ({ ...s, ativo: e.target.checked }))} />
            Ativo para orientar a IA
          </label>

          <div className="flex justify-between">
            {selecionado.id ? (
              <Button variant="danger" onClick={excluir}><Trash2 className="h-4 w-4" /> Excluir</Button>
            ) : <div />}
            <Button onClick={salvar} disabled={salvando || !selecionado.titulo || !selecionado.interpretacao}>
              <Save className="h-4 w-4" /> {salvando ? 'Salvando...' : 'Salvar modelo'}
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

function normalizarTitulo(titulo: string) {
  return String(titulo || '').trim().toLowerCase();
}
