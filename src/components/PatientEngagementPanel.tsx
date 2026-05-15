'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Copy, FileCheck2, FileText, Mail, RefreshCcw, Send, X } from 'lucide-react';

function dataBR(valor?: string | null) {
  if (!valor) return '';
  return new Date(valor).toLocaleDateString('pt-BR');
}

function dataHoraBR(valor?: string | null) {
  if (!valor) return '';
  return new Date(valor).toLocaleString('pt-BR');
}

function valorLegivel(valor: any): string {
  if (valor === null || valor === undefined || valor === '') return 'Nao informado';
  if (typeof valor === 'boolean') return valor ? 'Sim' : 'Nao';
  if (Array.isArray(valor)) return valor.map(valorLegivel).join(', ');
  if (typeof valor === 'object') {
    return Object.entries(valor)
      .filter(([, v]) => v !== null && v !== undefined && v !== '')
      .map(([k, v]) => `${humanizarChave(k)}: ${valorLegivel(v)}`)
      .join('; ') || 'Nao informado';
  }
  return String(valor);
}

function humanizarChave(chave: string) {
  return chave
    .replace(/^__/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, letra => letra.toUpperCase());
}

function camposAnamnese(resposta: any) {
  const respostas = resposta?.respostas ?? {};
  const template = Array.isArray(resposta?.anamnese_templates)
    ? resposta.anamnese_templates[0]
    : resposta?.anamnese_templates;
  const campos = Array.isArray(template?.campos) ? template.campos : [];
  const labels = new Map<string, string>(
    campos
      .filter((campo: any) => campo?.id)
      .map((campo: any) => [String(campo.id), String(campo.label ?? humanizarChave(String(campo.id)))])
  );
  const ocultas = new Set(['avaliacao_id', 'clinica_id', 'paciente_id', 'template_id', 'created_at', 'updated_at']);

  return Object.entries(respostas)
    .filter(([chave, valor]) => !chave.startsWith('__') && !ocultas.has(chave) && valor !== undefined && valor !== null && valor !== '')
    .map(([chave, valor]) => ({
      chave,
      label: labels.get(chave) ?? humanizarChave(chave),
      valor: valorLegivel(valor),
    }));
}

export function PatientEngagementPanel({ pacienteId }: { pacienteId: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [templates, setTemplates] = useState<any[]>([]);
  const [protocolos, setProtocolos] = useState<any[]>([]);
  const [modelosTermo, setModelosTermo] = useState<any[]>([]);
  const [links, setLinks] = useState<any[]>([]);
  const [linksTermo, setLinksTermo] = useState<any[]>([]);
  const [envios, setEnvios] = useState<any[]>([]);
  const [respostasAnamnese, setRespostasAnamnese] = useState<any[]>([]);
  const [aceites, setAceites] = useState<any[]>([]);
  const [templateId, setTemplateId] = useState('');
  const [termoId, setTermoId] = useState('');
  const [selecionados, setSelecionados] = useState<Record<string, boolean>>({});
  const [origin, setOrigin] = useState('');
  const [copiado, setCopiado] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [anamnesesAbertas, setAnamnesesAbertas] = useState<Record<string, boolean>>({});

  const carregar = useCallback(async () => {
    const [{ data: tpls }, { data: recs }, { data: termos }] = await Promise.all([
      supabase.from('anamnese_templates').select('id,nome,ativo').eq('ativo', true).order('nome'),
      supabase.from('protocolo_recomendacoes').select('*').eq('ativo', true).order('modulo').order('titulo'),
      supabase.from('consentimento_modelos').select('id,nome,tipo,versao,ativo').eq('ativo', true).order('tipo').order('nome'),
    ]);
    setTemplates(tpls ?? []);
    setTemplateId((tpls ?? [])[0]?.id ?? '');
    setProtocolos(recs ?? []);
    setModelosTermo(termos ?? []);
    setTermoId((termos ?? [])[0]?.id ?? '');

    const [linksRes, enviosRes, linksTermoRes] = await Promise.all([
      fetch(`/api/anamnese-links?pacienteId=${encodeURIComponent(pacienteId)}`, { cache: 'no-store' }),
      fetch(`/api/protocolo-envios?pacienteId=${encodeURIComponent(pacienteId)}`, { cache: 'no-store' }),
      fetch(`/api/consentimento-links?pacienteId=${encodeURIComponent(pacienteId)}`, { cache: 'no-store' }),
    ]);
    const linksBody = await linksRes.json().catch(() => ({}));
    const enviosBody = await enviosRes.json().catch(() => ({}));
    const linksTermoBody = await linksTermoRes.json().catch(() => ({}));
    setLinks(linksBody.data ?? []);
    setEnvios(enviosBody.data ?? []);
    setLinksTermo(linksTermoBody.data ?? []);
    setRespostasAnamnese(linksBody.respostas ?? []);
    setAceites(linksTermoBody.aceites ?? []);
  }, [pacienteId, supabase]);

  useEffect(() => {
    setOrigin(window.location.origin);
    carregar();
  }, [carregar]);

  async function gerarAnamnese() {
    setMsg(null);
    const res = await fetch('/api/anamnese-links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pacienteId, templateId }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg(body.error ?? 'Nao foi possivel gerar o link.');
      return;
    }
    setLinks(l => [body.data, ...l]);
    setMsg('Link de anamnese gerado. O envio por e-mail/WhatsApp sera conectado na proxima etapa.');
  }

  async function revogar(token: string) {
    if (!confirm('Revogar este link de anamnese?')) return;
    const res = await fetch('/api/anamnese-links', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    if (res.ok) setLinks(l => l.filter(x => x.token !== token));
  }

  async function gerarTermo() {
    setMsg(null);
    const res = await fetch('/api/consentimento-links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pacienteId, modeloId: termoId }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg(body.error ?? 'Nao foi possivel gerar o link do termo.');
      return;
    }
    setLinksTermo(l => [body.data, ...l]);
    setMsg('Link de termo/TCLE gerado. O envio por e-mail/WhatsApp sera conectado na proxima etapa.');
  }

  async function revogarTermo(token: string) {
    if (!confirm('Revogar este link de termo/TCLE?')) return;
    const res = await fetch('/api/consentimento-links', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    if (res.ok) setLinksTermo(l => l.filter(x => x.token !== token));
  }

  async function revogarAceite(aceiteId: string) {
    const motivo = prompt('Informe o motivo da revogacao/cancelamento do aceite:', 'Revogado a pedido do paciente/responsavel.');
    if (motivo === null) return;
    const tokenAceite = aceites.find(a => a.id === aceiteId)?.token;

    const res = await fetch('/api/consentimento-links', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aceiteId, revogarAceite: true, motivo }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg(body.error ?? 'Nao foi possivel revogar o aceite.');
      return;
    }

    setAceites(lista => lista.map(a => (
      a.id === aceiteId
        ? { ...a, revogado: true, revogado_em: body.revogado_em, motivo_revogacao: motivo || 'Revogado a pedido do paciente/responsavel.' }
        : a
    )));
    if (tokenAceite) setLinksTermo(lista => lista.filter(l => l.token !== tokenAceite));
    setMsg('Aceite revogado e mantido como historico auditavel.');
  }

  async function registrarEnvioProtocolos() {
    const recomendacoesIds = Object.entries(selecionados).filter(([, v]) => v).map(([id]) => id);
    setMsg(null);
    const res = await fetch('/api/protocolo-envios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pacienteId, recomendacoesIds }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg(body.error ?? 'Nao foi possivel registrar o envio.');
      return;
    }
    setEnvios(e => [body.data, ...e]);
    setMsg('Recomendações registradas para envio. O provedor de e-mail/WhatsApp ainda será conectado.');
  }

  async function copiar(url: string, token: string) {
    await navigator.clipboard.writeText(url);
    setCopiado(token);
    setTimeout(() => setCopiado(null), 1600);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Mail className="inline h-4 w-4 mr-1 text-brand-600" />
          Pré-atendimento
        </CardTitle>
      </CardHeader>
      <CardBody className="space-y-5">
        <div className="grid gap-3 md:grid-cols-4">
          <CentralStat label="Anamneses respondidas" value={respostasAnamnese.length} />
          <CentralStat label="Termos aceitos" value={aceites.filter(a => !a.revogado).length} />
          <CentralStat label="Recomendacoes enviadas" value={envios.length} />
          <CentralStat label="Links ativos" value={[...links, ...linksTermo].filter(l => !l.revogado && !l.aceito_em && !l.respondido_em).length} />
        </div>
        {msg && (
          <div className="rounded-lg border border-brand-100 bg-brand-50 px-3 py-2 text-sm text-brand-800">
            {msg}
          </div>
        )}

        <div className="rounded-xl border border-slate-200 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <div className="font-semibold text-slate-800">Enviar anamnese</div>
              <p className="text-sm text-slate-500">Gere um link seguro para o paciente responder antes da consulta.</p>
            </div>
            <Button onClick={gerarAnamnese} disabled={!templateId}>
              <Send className="h-4 w-4" /> Gerar link
            </Button>
          </div>
          <select
            value={templateId}
            onChange={e => setTemplateId(e.target.value)}
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
          >
            {templates.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
            {templates.length === 0 && <option value="">Nenhum template ativo</option>}
          </select>

          {links.length > 0 && (
            <div className="mt-3 space-y-2">
              {links.map(link => {
                const url = `${origin}/pre-atendimento/anamnese/${link.token}`;
                return (
                  <div key={link.token} className="flex flex-col gap-2 rounded-lg bg-slate-50 p-3 md:flex-row md:items-center">
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-slate-500">
                        {link.anamnese_templates?.nome ?? 'Anamnese'} · expira em {dataBR(link.expira_em)}
                      </div>
                      <div className="truncate font-mono text-xs text-slate-600">{url}</div>
                    </div>
                    <Button size="sm" variant="secondary" onClick={() => copiar(url, link.token)}>
                      <Copy className="h-3 w-3" /> {copiado === link.token ? 'Copiado' : 'Copiar'}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => revogar(link.token)} title="Revogar">
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
          {respostasAnamnese.length > 0 && (
            <div className="mt-4 border-t border-slate-100 pt-3 text-sm text-slate-600">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Anamneses respondidas</div>
              <div className="space-y-3">
                {respostasAnamnese.map(r => {
                  const template = Array.isArray(r.anamnese_templates) ? r.anamnese_templates[0] : r.anamnese_templates;
                  const campos = camposAnamnese(r);
                  const aberta = !!anamnesesAbertas[r.id];
                  return (
                    <div key={r.id} className="rounded-xl border border-slate-200 bg-white p-3">
                      <button
                        type="button"
                        onClick={() => setAnamnesesAbertas(atual => ({ ...atual, [r.id]: !atual[r.id] }))}
                        className="flex w-full items-center justify-between gap-3 text-left"
                      >
                        <span>
                          <span className="block font-medium text-slate-800">{template?.nome ?? 'Anamnese respondida'}</span>
                          <span className="text-xs text-slate-500">
                            Respondida em {dataHoraBR(r.enviado_em)} {r.avaliacao_id ? '· vinculada a avaliacao' : ''}
                          </span>
                        </span>
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                          {aberta ? 'Ocultar respostas' : `Ver ${campos.length} resposta(s)`}
                        </span>
                      </button>
                      {aberta && (
                        <div className="mt-3 grid gap-2 md:grid-cols-2">
                          {campos.map(campo => (
                            <div key={campo.chave} className="rounded-lg bg-slate-50 px-3 py-2">
                              <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{campo.label}</div>
                              <div className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{campo.valor}</div>
                            </div>
                          ))}
                          {campos.length === 0 && (
                            <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-500">
                              Nenhuma resposta preenchida foi encontrada neste envio.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <div className="font-semibold text-slate-800">Enviar termo/TCLE</div>
              <p className="text-sm text-slate-500">Gere um link para aceite digital com registro de data, IP e versao do texto.</p>
            </div>
            <Button onClick={gerarTermo} disabled={!termoId}>
              <FileCheck2 className="h-4 w-4" /> Gerar link
            </Button>
          </div>
          <select
            value={termoId}
            onChange={e => setTermoId(e.target.value)}
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
          >
            {modelosTermo.map(t => (
              <option key={t.id} value={t.id}>
                {t.tipo === 'tcle' ? 'TCLE' : 'Consentimento'} - {t.nome} v{t.versao}
              </option>
            ))}
            {modelosTermo.length === 0 && <option value="">Nenhum termo ativo</option>}
          </select>

          {linksTermo.length > 0 && (
            <div className="mt-3 space-y-2">
              {linksTermo.map(link => {
                const url = `${origin}/pre-atendimento/consentimento/${link.token}`;
                const modelo = Array.isArray(link.consentimento_modelos) ? link.consentimento_modelos[0] : link.consentimento_modelos;
                return (
                  <div key={link.token} className="flex flex-col gap-2 rounded-lg bg-slate-50 p-3 md:flex-row md:items-center">
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-slate-500">
                        {modelo?.nome ?? 'Termo'} {link.aceito_em ? `· aceito em ${dataBR(link.aceito_em)}` : `· expira em ${dataBR(link.expira_em)}`}
                      </div>
                      <div className="truncate font-mono text-xs text-slate-600">{url}</div>
                    </div>
                    <Button size="sm" variant="secondary" onClick={() => copiar(url, link.token)}>
                      <Copy className="h-3 w-3" /> {copiado === link.token ? 'Copiado' : 'Copiar'}
                    </Button>
                    {!link.aceito_em && (
                      <Button size="sm" variant="ghost" onClick={() => revogarTermo(link.token)} title="Revogar">
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {aceites.length > 0 && (
            <div className="mt-4 border-t border-slate-100 pt-3 text-sm text-slate-600">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Comprovantes de aceite</div>
              <div className="space-y-2">
                {aceites.slice(0, 8).map(a => {
                  const comprovanteUrl = a.token ? `${origin}/pre-atendimento/consentimento/${a.token}` : '';
                  const revogado = !!a.revogado;
                  return (
                    <div key={`novo-${a.id}`} className={`flex flex-col gap-2 rounded-lg px-3 py-2 md:flex-row md:items-center ${revogado ? 'bg-amber-50' : 'bg-emerald-50'}`}>
                      <div className="min-w-0 flex-1">
                        <div className={`font-medium ${revogado ? 'text-amber-900' : 'text-emerald-900'}`}>
                          {a.modelo_nome ?? 'Termo aceito'} {revogado ? '· revogado' : ''}
                        </div>
                        <div className={`text-xs ${revogado ? 'text-amber-800' : 'text-emerald-800'}`}>
                          Aceito em {dataBR(a.aceito_em)} · versão {a.texto_versao ?? '-'} · IP {a.ip ?? 'não registrado'}
                        </div>
                        {revogado && (
                          <div className="text-xs text-amber-800">
                            Revogado em {dataBR(a.revogado_em)} · {a.motivo_revogacao ?? 'sem motivo informado'}
                          </div>
                        )}
                        {a.user_agent && <div className={`truncate text-[11px] ${revogado ? 'text-amber-700' : 'text-emerald-700'}`}>Dispositivo/navegador: {a.user_agent}</div>}
                      </div>
                      {comprovanteUrl && (
                        <Button size="sm" variant="secondary" onClick={() => copiar(comprovanteUrl, a.id)}>
                          <Copy className="h-3 w-3" /> {copiado === a.id ? 'Copiado' : 'Comprovante'}
                        </Button>
                      )}
                      {!revogado && (
                        <Button size="sm" variant="ghost" onClick={() => revogarAceite(a.id)} title="Revogar aceite">
                          <X className="h-3 w-3" /> Revogar aceite
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <div className="font-semibold text-slate-800">Enviar recomendações pré-teste</div>
              <p className="text-sm text-slate-500">Selecione as orientações cadastradas para este paciente.</p>
            </div>
            <Button onClick={registrarEnvioProtocolos}>
              <FileText className="h-4 w-4" /> Registrar envio
            </Button>
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            {protocolos.map(p => (
              <label key={p.id} className="flex items-start gap-2 rounded-lg border border-slate-200 bg-white p-3 text-sm">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={!!selecionados[p.id]}
                  onChange={e => setSelecionados(s => ({ ...s, [p.id]: e.target.checked }))}
                />
                <span>
                  <span className="font-medium text-slate-800">{p.titulo}</span>
                  <span className="block text-xs text-slate-500">{p.modulo}</span>
                </span>
              </label>
            ))}
          </div>
          {protocolos.length === 0 && (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
              Nenhuma recomendação ativa cadastrada.
            </div>
          )}
          {envios.length > 0 && (
            <div className="mt-4 border-t border-slate-100 pt-3">
              <div className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <RefreshCcw className="h-3 w-3" /> Histórico de envios
              </div>
              <div className="space-y-1 text-sm text-slate-600">
                {envios.slice(0, 4).map(e => (
                  <div key={e.id}>Registrado em {dataBR(e.enviado_em)} · {e.recomendacoes_ids?.length ?? 0} recomendação(ões)</div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}

function CentralStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
      <div className="text-2xl font-bold text-slate-800">{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}
