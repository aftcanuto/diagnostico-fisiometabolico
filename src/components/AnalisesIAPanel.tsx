'use client';
import { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Textarea } from './ui/Input';
import { Sparkles, Loader2, Check, Edit3, Save, X } from 'lucide-react';

const MODULOS: { tipo: string; label: string }[] = [
  { tipo: 'anamnese', label: 'Anamnese' },
  { tipo: 'sinais_vitais', label: 'Sinais vitais' },
  { tipo: 'posturografia', label: 'Posturografia' },
  { tipo: 'bioimpedancia', label: 'Bioimpedância' },
  { tipo: 'antropometria', label: 'Antropometria' },
  { tipo: 'forca', label: 'Força' },
  { tipo: 'flexibilidade', label: 'Flexibilidade' },
  { tipo: 'rml', label: 'RML' },
  { tipo: 'cardiorrespiratorio', label: 'Cardio' },
  { tipo: 'biomecanica_corrida', label: 'Biomecânica' },
  { tipo: 'conclusao_global', label: 'Conclusão global' },
  { tipo: 'evolucao', label: 'Evolução' },
];

interface Props {
  avaliacaoId: string;
  modulosDisponiveis: Record<string, boolean>;
  temMultiplasAvaliacoes: boolean;
}

export function AnalisesIAPanel({ avaliacaoId, modulosDisponiveis, temMultiplasAvaliacoes }: Props) {
  const [analises, setAnalises] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<string | null>(null);
  const [editando, setEditando] = useState<string | null>(null);
  const [rascunho, setRascunho] = useState<string>('');
  const [rascunhoPaciente, setRascunhoPaciente] = useState<string>('');
  const [rascunhoPlano, setRascunhoPlano] = useState<string>('');

  useEffect(() => {
    fetch(`/api/ia/editar?avaliacaoId=${encodeURIComponent(avaliacaoId)}`, { cache: 'no-store' })
      .then(async res => {
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error ?? 'Erro ao carregar analises');
        return json.data ?? [];
      })
      .then((data: any[]) => {
        const map: Record<string, any> = {};
        (data ?? []).forEach(a => { map[a.tipo] = a; });
        setAnalises(map);
      })
      .catch((error) => {
        console.error('[AnalisesIAPanel] Nao foi possivel carregar analises', error);
      });
  }, [avaliacaoId]);

  async function gerar(tipo: string) {
    setLoading(tipo);
    try {
      const res = await fetch('/api/ia/gerar', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avaliacaoId, tipo }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Erro');
      setAnalises(a => ({ ...a, [tipo]: { tipo, conteudo: json.conteudo } }));
    } catch (e: any) {
      alert(e.message);
    } finally { setLoading(null); }
  }

  async function salvarEdicao(tipo: string) {
    const res = await fetch('/api/ia/editar', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        avaliacaoId,
        tipo,
        textoEditado: rascunho,
        textoPacienteEditado: rascunhoPaciente,
        planoAcao: tipo === 'conclusao_global' ? rascunhoPlano : undefined,
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(json.error ?? 'Erro ao salvar analise');
      return;
    }
    setAnalises(a => ({
      ...a,
      [tipo]: {
        ...a[tipo],
        texto_editado: rascunho,
        texto_paciente_editado: rascunhoPaciente,
        plano_acao: tipo === 'conclusao_global' ? rascunhoPlano : a[tipo]?.plano_acao,
      },
    }));
    setEditando(null); setRascunho(''); setRascunhoPaciente(''); setRascunhoPlano('');
  }

  function isDisponivel(tipo: string) {
    if (tipo === 'evolucao') return temMultiplasAvaliacoes;
    if (tipo === 'conclusao_global') return true;
    // biomecanica_corrida usa chave 'biomecanica' nos modulos_selecionados
    if (tipo === 'biomecanica_corrida') return !!modulosDisponiveis['biomecanica'] || !!modulosDisponiveis['biomecanica_corrida'];
    return !!modulosDisponiveis[tipo];
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Sparkles className="inline w-4 h-4 mr-1 text-brand-600" />
          Análises com IA
        </CardTitle>
      </CardHeader>
      <CardBody className="space-y-3">
        <p className="text-sm text-slate-500">
          Gere interpretações, riscos e recomendações para cada módulo.
          Você pode revisar e editar antes de incluir no relatório.
        </p>

        {MODULOS.filter(m => isDisponivel(m.tipo)).map(m => {
          const a = analises[m.tipo];
          const ed = editando === m.tipo;
          return (
            <div key={m.tipo} className="rounded-lg border border-slate-200 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{m.label}</span>
                  {a && <span className="text-xs text-emerald-600 inline-flex items-center gap-1"><Check className="w-3 h-3" /> gerada</span>}
                </div>
                <div className="flex gap-1">
                  {a && !ed && (
                    <Button size="sm" variant="ghost" onClick={() => {
                      setEditando(m.tipo);
                      setRascunho(a.texto_editado || renderizarTextoBase(a.conteudo));
                      setRascunhoPaciente(a.texto_paciente_editado || renderizarTextoBase(a.conteudo_paciente) || resumirParaPaciente(a.texto_editado || renderizarTextoBase(a.conteudo)));
                      setRascunhoPlano(renderizarTextoBase(a.plano_acao));
                    }}><Edit3 className="w-3 h-3" /></Button>
                  )}
                  <Button size="sm" variant="secondary" onClick={() => gerar(m.tipo)} disabled={loading === m.tipo}>
                    {loading === m.tipo ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    {a ? 'Regerar' : 'Gerar'}
                  </Button>
                </div>
              </div>

              {ed && (
                <div className="mt-3 space-y-2">
                  <div>
                    <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Versão técnica do avaliador</div>
                    <Textarea value={rascunho} onChange={e => setRascunho(e.target.value)} className="min-h-[160px] text-sm" />
                  </div>
                  <div>
                    <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Versão simplificada para paciente/PDF</div>
                    <Textarea value={rascunhoPaciente} onChange={e => setRascunhoPaciente(e.target.value)} className="min-h-[120px] text-sm" />
                  </div>
                  {m.tipo === 'conclusao_global' && (
                    <div>
                      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Plano de aÃ§Ã£o pÃ³s-laudo</div>
                      <Textarea
                        value={rascunhoPlano}
                        onChange={e => setRascunhoPlano(e.target.value)}
                        placeholder="Prioridades clÃ­nicas, metas de 30/60/90 dias, recomendaÃ§Ãµes por Ã¡rea e alertas de encaminhamento."
                        className="min-h-[150px] text-sm"
                      />
                    </div>
                  )}
                  <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="ghost" onClick={() => { setEditando(null); setRascunho(''); setRascunhoPaciente(''); setRascunhoPlano(''); }}><X className="w-3 h-3" /> Cancelar</Button>
                    <Button size="sm" onClick={() => salvarEdicao(m.tipo)}><Save className="w-3 h-3" /> Salvar</Button>
                  </div>
                </div>
              )}

              {a && !ed && <AnaliseConteudo a={a} />}
            </div>
          );
        })}
      </CardBody>
    </Card>
  );
}

function AnaliseConteudo({ a }: { a: any }) {
  const textoPaciente = a.texto_paciente_editado || renderizarTextoBase(a.conteudo_paciente);
  const planoAcao = typeof a.plano_acao === 'string' ? a.plano_acao : renderizarTextoBase(a.plano_acao);
  if (a.texto_editado) {
    return (
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Versão técnica</div>
          <div className="text-sm text-slate-700 whitespace-pre-wrap">{a.texto_editado}</div>
        </div>
        <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">Versão paciente</div>
          <div className="text-sm text-slate-700 whitespace-pre-wrap">{textoPaciente || resumirParaPaciente(a.texto_editado)}</div>
        </div>
      </div>
    );
  }
  const c = a.conteudo || {};
  return (
    <div className="mt-3 space-y-2 text-sm">
      {c.resumo_executivo && (
        <div className="rounded bg-brand-50 p-2 text-slate-700"><b>Resumo:</b> {c.resumo_executivo}</div>
      )}
      {c.resumo_clinico && (
        <div className="rounded bg-brand-50 p-2 text-slate-700"><b>Resumo clínico:</b> {c.resumo_clinico}</div>
      )}
      {c.interpretacao && (
        <div className="text-slate-700"><b>Interpretação:</b> {c.interpretacao}</div>
      )}
      {Array.isArray(c.achados) && c.achados.length > 0 && (
        <ListItem titulo="Achados" itens={c.achados} />
      )}
      {Array.isArray(c.principais_achados) && c.principais_achados.length > 0 && (
        <ListItem titulo="Principais achados" itens={c.principais_achados} />
      )}
      {Array.isArray(c.pontos_fortes) && c.pontos_fortes.length > 0 && (
        <ListItem titulo="Pontos fortes" itens={c.pontos_fortes} cor="emerald" />
      )}
      {Array.isArray(c.pontos_criticos) && c.pontos_criticos.length > 0 && (
        <ListItem titulo="Pontos críticos" itens={c.pontos_criticos} cor="red" />
      )}
      {Array.isArray(c.riscos) && c.riscos.length > 0 && (
        <ListItem titulo="Riscos" itens={c.riscos} cor="red" />
      )}
      {Array.isArray(c.riscos_atencoes) && c.riscos_atencoes.length > 0 && (
        <ListItem titulo="Riscos e atenções" itens={c.riscos_atencoes} cor="red" />
      )}
      {Array.isArray(c.beneficios) && c.beneficios.length > 0 && (
        <ListItem titulo="Benefícios da correção" itens={c.beneficios} cor="emerald" />
      )}
      {Array.isArray(c.recomendacoes) && c.recomendacoes.length > 0 && (
        <ListItem titulo="Recomendações" itens={c.recomendacoes} cor="brand" />
      )}
      {Array.isArray(c.recomendacoes_praticas) && c.recomendacoes_praticas.length > 0 && (
        <ListItem titulo="Recomendações práticas" itens={c.recomendacoes_praticas} cor="brand" />
      )}
      {c.encaminhamento && (
        <div className="rounded bg-amber-50 p-2 text-amber-800"><b>Encaminhamento:</b> {c.encaminhamento}</div>
      )}
      {c.limitacoes && (
        <div className="rounded bg-slate-50 p-2 text-slate-600"><b>Limitações:</b> {c.limitacoes}</div>
      )}
      {Array.isArray(c.alertas) && c.alertas.length > 0 && (
        <ListItem titulo="⚠️ Alertas" itens={c.alertas} cor="amber" />
      )}
      {Array.isArray(c.prioridades) && (
        <div>
          <b className="text-slate-700">Prioridades de intervenção:</b>
          <ol className="list-decimal pl-5 space-y-1 mt-1">
            {c.prioridades.map((p: any, i: number) => (
              <li key={i}><b>{p.titulo}</b> — {p.acao} <span className="text-xs text-slate-500">({p.prazo})</span></li>
            ))}
          </ol>
        </div>
      )}
      {Array.isArray(c.tendencias) && (
        <ListItem titulo="Tendências" itens={c.tendencias} cor="brand" />
      )}
      {Array.isArray(c.progressos) && c.progressos.length > 0 && (
        <ListItem titulo="Progressos" itens={c.progressos} cor="emerald" />
      )}
      {Array.isArray(c.regressoes) && c.regressoes.length > 0 && (
        <ListItem titulo="Regressões" itens={c.regressoes} cor="red" />
      )}
      {Array.isArray(c.proximos_passos) && (
        <ListItem titulo="Próximos passos" itens={c.proximos_passos} cor="brand" />
      )}
      {c.mensagem_paciente && (
        <div className="rounded bg-emerald-50 p-2 text-emerald-800 italic">💬 {c.mensagem_paciente}</div>
      )}
    </div>
  );
}

function PlanoAcaoBox({ texto }: { texto: string }) {
  return (
    <div className="rounded-lg border border-cyan-100 bg-cyan-50 p-3">
      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-cyan-800">Plano de a????o p??s-laudo</div>
      <div className="text-sm text-slate-700 whitespace-pre-wrap">{texto}</div>
    </div>
  );
}

function ListItem({ titulo, itens, cor = 'slate' }: { titulo: string; itens: string[]; cor?: string }) {
  const bgMap: Record<string, string> = {
    slate: 'bg-slate-50 text-slate-700',
    emerald: 'bg-emerald-50 text-emerald-800',
    red: 'bg-red-50 text-red-800',
    amber: 'bg-amber-50 text-amber-800',
    brand: 'bg-brand-50 text-brand-800',
  };
  return (
    <div className={`rounded p-2 ${bgMap[cor]}`}>
      <b className="block mb-1">{titulo}:</b>
      <ul className="list-disc pl-5 space-y-0.5">
        {itens.map((t, i) => <li key={i}>{t}</li>)}
      </ul>
    </div>
  );
}

function renderizarTextoBase(c: any): string {
  if (!c) return '';
  if (typeof c === 'string') return c;
  if (c.texto) return c.texto;
  const partes: string[] = [];
  if (c.resumo_executivo) partes.push('RESUMO:\n' + c.resumo_executivo);
  if (c.resumo_clinico) partes.push('RESUMO CLÍNICO:\n' + c.resumo_clinico);
  if (c.interpretacao) partes.push('INTERPRETAÇÃO:\n' + c.interpretacao);
  if (Array.isArray(c.achados)) partes.push('ACHADOS:\n' + c.achados.map((x: string) => '• ' + x).join('\n'));
  if (Array.isArray(c.principais_achados)) partes.push('PRINCIPAIS ACHADOS:\n' + c.principais_achados.map((x: string) => '• ' + x).join('\n'));
  if (Array.isArray(c.riscos)) partes.push('RISCOS:\n' + c.riscos.map((x: string) => '• ' + x).join('\n'));
  if (Array.isArray(c.riscos_atencoes)) partes.push('RISCOS E ATENÇÕES:\n' + c.riscos_atencoes.map((x: string) => '• ' + x).join('\n'));
  if (Array.isArray(c.beneficios)) partes.push('BENEFÍCIOS:\n' + c.beneficios.map((x: string) => '• ' + x).join('\n'));
  if (Array.isArray(c.recomendacoes)) partes.push('RECOMENDAÇÕES:\n' + c.recomendacoes.map((x: string) => '• ' + x).join('\n'));
  if (Array.isArray(c.recomendacoes_praticas)) partes.push('RECOMENDAÇÕES PRÁTICAS:\n' + c.recomendacoes_praticas.map((x: string) => '• ' + x).join('\n'));
  if (c.encaminhamento) partes.push('ENCAMINHAMENTO:\n' + c.encaminhamento);
  if (c.limitacoes) partes.push('LIMITAÇÕES:\n' + c.limitacoes);
  if (Array.isArray(c.alertas)) partes.push('ALERTAS:\n' + c.alertas.map((x: string) => '• ' + x).join('\n'));
  if (Array.isArray(c.pontos_fortes)) partes.push('PONTOS FORTES:\n' + c.pontos_fortes.map((x: string) => '• ' + x).join('\n'));
  if (Array.isArray(c.pontos_criticos)) partes.push('PONTOS CRÍTICOS:\n' + c.pontos_criticos.map((x: string) => '• ' + x).join('\n'));
  if (Array.isArray(c.tendencias)) partes.push('TENDÊNCIAS:\n' + c.tendencias.map((x: string) => '• ' + x).join('\n'));
  if (Array.isArray(c.progressos)) partes.push('PROGRESSOS:\n' + c.progressos.map((x: string) => '• ' + x).join('\n'));
  if (Array.isArray(c.regressoes)) partes.push('REGRESSÕES:\n' + c.regressoes.map((x: string) => '• ' + x).join('\n'));
  if (Array.isArray(c.proximos_passos)) partes.push('PRÓXIMOS PASSOS:\n' + c.proximos_passos.map((x: string) => '• ' + x).join('\n'));
  if (Array.isArray(c.prioridades)) {
    partes.push('PRIORIDADES:\n' + c.prioridades.map((p: any) => `• ${p.titulo ?? 'Prioridade'}: ${p.acao ?? ''}${p.prazo ? ` (${p.prazo})` : ''}`).join('\n'));
  }
  if (c.mensagem_paciente) partes.push('MENSAGEM AO PACIENTE:\n' + c.mensagem_paciente);
  return partes.join('\n\n');
}

function resumirParaPaciente(texto: string): string {
  if (!texto) return '';
  return texto
    .replace(/\bdiagn[oó]stico\b/gi, 'avaliação')
    .replace(/\bcr[ií]tico(s)?\b/gi, 'pontos de atenção')
    .split('\n')
    .filter(Boolean)
    .slice(0, 8)
    .join('\n');
}
