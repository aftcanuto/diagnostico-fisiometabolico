'use client';

import { useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CalendarClock, CheckCircle2, MessageCircle, RefreshCw, Trash2, XCircle } from 'lucide-react';

type Agendamento = {
  id: string;
  produto_nome: string;
  cliente_nome: string;
  cliente_email?: string | null;
  cliente_telefone: string;
  data_preferida?: string | null;
  horario_preferido?: string | null;
  periodo_preferido?: string | null;
  observacoes?: string | null;
  valor_sinal?: number | string | null;
  preco_total?: number | string | null;
  sinal_percentual?: number | string | null;
  status: string;
  pagamento_url?: string | null;
  created_at?: string | null;
  pago_em?: string | null;
  expires_at?: string | null;
  mercado_pago_preference_id?: string | null;
  mercado_pago_payment_id?: string | null;
  mercado_pago_status?: string | null;
  mercado_pago_status_detail?: string | null;
  mercado_pago_updated_at?: string | null;
};

export function CatalogoAgendamentosPanel({ clinicaId, initialItems }: { clinicaId: string; initialItems: Agendamento[] }) {
  const supabase = useMemo(() => createClient(), []);
  const [items, setItems] = useState(initialItems);
  const [filtro, setFiltro] = useState('ativos');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const filtrados = filtrarItems(items, filtro);
  const cancelados = items.filter(item => isLimpo(item.status)).length;
  const resumo = resumoFinanceiro(items);

  async function carregar() {
    setCarregando(true);
    setErro(null);
    await supabase
      .from('catalogo_agendamentos')
      .update({ status: 'expirado' })
      .eq('clinica_id', clinicaId)
      .eq('status', 'aguardando_pagamento')
      .lt('expires_at', new Date().toISOString());
    const { data, error } = await supabase
      .from('catalogo_agendamentos')
      .select('*')
      .eq('clinica_id', clinicaId)
      .order('created_at', { ascending: false })
      .limit(100);
    setCarregando(false);
    if (error) {
      setErro(`Não foi possível carregar agendamentos: ${error.message}`);
      return;
    }
    setItems(data ?? []);
  }

  async function atualizarStatus(id: string, status: string) {
    setErro(null);
    const patch: Record<string, unknown> = { status };
    if (status === 'confirmado') patch.confirmado_em = new Date().toISOString();
    const { error } = await supabase.from('catalogo_agendamentos').update(patch).eq('id', id);
    if (error) {
      setErro(`Não foi possível atualizar: ${error.message}`);
      return;
    }
    setItems(lista => lista.map(item => item.id === id ? { ...item, status } : item));
  }

  async function excluir(id: string) {
    const item = items.find(agendamento => agendamento.id === id);
    if (!item || !isLimpo(item.status)) return;
    if (!confirm('Excluir este pedido cancelado da tela? Esta ação não poderá ser desfeita.')) return;

    setErro(null);
    const { error } = await supabase.from('catalogo_agendamentos').delete().eq('id', id);
    if (error) {
      setErro(`Não foi possível excluir: ${error.message}`);
      return;
    }
    setItems(lista => lista.filter(agendamento => agendamento.id !== id));
  }

  async function limparCancelados() {
    if (!cancelados) return;
    if (!confirm(`Excluir ${cancelados} pedido(s) cancelado(s)/expirado(s) da tela? Esta ação não poderá ser desfeita.`)) return;

    setErro(null);
    const { error } = await supabase
      .from('catalogo_agendamentos')
      .delete()
      .eq('clinica_id', clinicaId)
      .in('status', ['cancelado', 'expirado']);
    if (error) {
      setErro(`Não foi possível limpar cancelados: ${error.message}`);
      return;
    }
    setItems(lista => lista.filter(item => !isLimpo(item.status)));
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardBody>
          <div className="mb-4 grid gap-3 md:grid-cols-5">
            <ResumoCard label="Total recebido" value={moeda(resumo.recebido)} />
            <ResumoCard label="Aguardando" value={moeda(resumo.aguardando)} />
            <ResumoCard label="Pedidos pagos" value={String(resumo.pagos)} />
            <ResumoCard label="Ticket médio" value={moeda(resumo.ticketMedio)} />
            <ResumoCard label="Cancelados/expirados" value={String(resumo.cancelados)} />
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-2">
              {STATUS_FILTROS.map(status => (
                <button
                  key={status.value}
                  type="button"
                  onClick={() => setFiltro(status.value)}
                  className={`rounded-full px-3 py-1.5 text-sm font-semibold ${filtro === status.value ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  {status.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {cancelados > 0 && (
                <Button variant="danger" onClick={limparCancelados}>
                  <Trash2 className="h-4 w-4" /> Limpar cancelados
                </Button>
              )}
              <Button variant="secondary" onClick={carregar} disabled={carregando}>
                <RefreshCw className={`h-4 w-4 ${carregando ? 'animate-spin' : ''}`} /> Atualizar
              </Button>
            </div>
          </div>
          {filtro === 'ativos' && cancelados > 0 && (
            <p className="mt-3 text-xs text-slate-500">
              {cancelados} pedido(s) cancelado(s) ou expirado(s) estão ocultos da visão principal.
            </p>
          )}
          {erro && <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</div>}
        </CardBody>
      </Card>

      {filtrados.length === 0 ? (
        <Card>
          <CardBody className="py-12 text-center">
            <CalendarClock className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            <p className="text-slate-500">Nenhum agendamento encontrado.</p>
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtrados.map(item => (
            <Card key={item.id}>
              <CardBody>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-bold text-slate-800">{item.produto_nome}</h2>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${statusClass(item.status)}`}>{statusLabel(item.status)}</span>
                    </div>
                    <div className="mt-1 text-sm text-slate-600">
                      <b>{item.cliente_nome}</b> · {item.cliente_telefone}
                      {item.cliente_email ? ` · ${item.cliente_email}` : ''}
                    </div>
                    <div className="mt-2 grid gap-1 text-sm text-slate-500 md:grid-cols-3">
                      <div><b>Valor:</b> {moeda(item.valor_sinal)}</div>
                      <div><b>Data:</b> {item.data_preferida ? formatarData(item.data_preferida) : 'A combinar'}</div>
                      <div><b>Horário:</b> {item.horario_preferido || item.periodo_preferido || 'A combinar'}</div>
                    </div>
                    <div className="mt-2 grid gap-1 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500 md:grid-cols-2">
                      <div><b>Expira:</b> {item.expires_at && item.status === 'aguardando_pagamento' ? formatarDataHora(item.expires_at) : '-'}</div>
                      <div><b>Pago em:</b> {item.pago_em ? formatarDataHora(item.pago_em) : '-'}</div>
                      <div><b>MP Payment ID:</b> {item.mercado_pago_payment_id || '-'}</div>
                      <div><b>MP Preference ID:</b> {item.mercado_pago_preference_id || '-'}</div>
                      <div><b>Status gateway:</b> {[item.mercado_pago_status, item.mercado_pago_status_detail].filter(Boolean).join(' / ') || '-'}</div>
                      <div><b>Atualizado gateway:</b> {item.mercado_pago_updated_at ? formatarDataHora(item.mercado_pago_updated_at) : '-'}</div>
                    </div>
                    {item.observacoes && <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">{item.observacoes}</p>}
                  </div>
                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    <a
                      href={whatsappUrl(item)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <MessageCircle className="h-4 w-4" /> WhatsApp
                    </a>
                    {item.pagamento_url && !isLimpo(item.status) && (
                      <a
                        href={item.pagamento_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-9 items-center rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Link pagamento
                      </a>
                    )}
                    {item.status === 'pagamento_recebido' && (
                      <Button size="sm" onClick={() => atualizarStatus(item.id, 'confirmado')}>
                        <CheckCircle2 className="h-4 w-4" /> Confirmar
                      </Button>
                    )}
                    {['aguardando_pagamento', 'pagamento_recebido', 'confirmado'].includes(item.status) && (
                      <Button size="sm" variant="danger" onClick={() => atualizarStatus(item.id, 'cancelado')}>
                        <XCircle className="h-4 w-4" /> Cancelar
                      </Button>
                    )}
                    {isLimpo(item.status) && (
                      <Button size="sm" variant="danger" onClick={() => excluir(item.id)}>
                        <Trash2 className="h-4 w-4" /> Excluir
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

const STATUS_FILTROS = [
  { value: 'ativos', label: 'Todos ativos' },
  { value: 'aguardando_pagamento', label: 'Aguardando' },
  { value: 'pagamento_recebido', label: 'Pagos' },
  { value: 'confirmado', label: 'Confirmados' },
  { value: 'cancelado', label: 'Cancelados' },
];

function filtrarItems(items: Agendamento[], filtro: string) {
  if (filtro === 'ativos') return items.filter(item => !isLimpo(item.status));
  if (filtro === 'cancelado') return items.filter(item => isLimpo(item.status));
  return items.filter(item => item.status === filtro);
}

function isLimpo(status: string) {
  return status === 'cancelado' || status === 'expirado';
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    aguardando_pagamento: 'Aguardando pagamento',
    pagamento_recebido: 'Pagamento recebido',
    confirmado: 'Confirmado',
    cancelado: 'Cancelado',
    expirado: 'Expirado',
  };
  return labels[status] ?? status;
}

function statusClass(status: string) {
  if (status === 'pagamento_recebido' || status === 'confirmado') return 'bg-emerald-100 text-emerald-700';
  if (isLimpo(status)) return 'bg-red-100 text-red-700';
  return 'bg-amber-100 text-amber-700';
}

function moeda(valor: Agendamento['valor_sinal']) {
  const numero = Number(valor ?? 0);
  return numero.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatarData(data: string) {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo' }).format(new Date(`${data}T12:00:00`));
}

function formatarDataHora(data: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(data));
}

function whatsappUrl(item: Agendamento) {
  const digits = String(item.cliente_telefone ?? '').replace(/\D/g, '');
  const numero = digits.startsWith('55') ? digits : `55${digits}`;
  const quando = item.data_preferida
    ? ` para ${formatarData(item.data_preferida)}${item.horario_preferido ? ` às ${item.horario_preferido}` : ''}`
    : '';
  const texto = `Olá, ${item.cliente_nome}. Recebemos seu pedido de ${item.produto_nome}${quando}. Status atual: ${statusLabel(item.status)}.`;
  return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
}

function resumoFinanceiro(items: Agendamento[]) {
  const pagos = items.filter(item => ['pagamento_recebido', 'confirmado'].includes(item.status));
  const aguardando = items.filter(item => item.status === 'aguardando_pagamento');
  const recebido = pagos.reduce((total, item) => total + Number(item.valor_sinal ?? 0), 0);
  const pendente = aguardando.reduce((total, item) => total + Number(item.valor_sinal ?? 0), 0);
  return {
    recebido,
    aguardando: pendente,
    pagos: pagos.length,
    ticketMedio: pagos.length ? recebido / pagos.length : 0,
    cancelados: items.filter(item => isLimpo(item.status)).length,
  };
}

function ResumoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
      <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-1 text-lg font-black text-slate-800">{value}</div>
    </div>
  );
}
