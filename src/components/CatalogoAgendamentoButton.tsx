'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, MessageCircle, X } from 'lucide-react';

type Props = {
  clinicaId: string;
  produtoId: string;
  produtoNome: string;
  sinal: number | null;
  cor: string;
  whatsappHref?: string | null;
  agendaDiasSemana?: number[];
  agendaPeriodos?: string[];
  agendaHorarios?: Record<string, string[]>;
  exigirDataAgendamento?: boolean;
  checkoutResumoTexto?: string | null;
  politicaPagamento?: string | null;
  mensagemPosPagamento?: string | null;
};

export function CatalogoAgendamentoButton({
  clinicaId,
  produtoId,
  produtoNome,
  sinal,
  cor,
  whatsappHref,
  agendaHorarios = {},
  exigirDataAgendamento = true,
  checkoutResumoTexto,
  politicaPagamento,
}: Props) {
  const [aberto, setAberto] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [consultandoHorarios, setConsultandoHorarios] = useState(false);
  const [horariosLivres, setHorariosLivres] = useState<string[] | null>(null);
  const [erro, setErro] = useState('');
  const [form, setForm] = useState({
    nome: '',
    telefone: '',
    email: '',
    dataPreferida: '',
    horarioPreferido: '',
    cupomCodigo: '',
    observacoes: '',
  });

  const horariosDoDia = useMemo(() => horariosDisponiveis(form.dataPreferida, agendaHorarios), [agendaHorarios, form.dataPreferida]);
  const horariosParaEscolha = horariosLivres ?? horariosDoDia;
  const datasDisponiveis = useMemo(() => datasFuturasDisponiveis(agendaHorarios), [agendaHorarios]);

  useEffect(() => {
    if (!exigirDataAgendamento || !form.dataPreferida) {
      setHorariosLivres(null);
      return;
    }

    let ativo = true;
    setConsultandoHorarios(true);
    setHorariosLivres(null);
    const params = new URLSearchParams({ clinicaId, produtoId, data: form.dataPreferida });
    fetch(`/api/catalogo/disponibilidade?${params.toString()}`)
      .then(response => response.ok ? response.json() : null)
      .then(body => {
        if (!ativo) return;
        const horarios = Array.isArray(body?.horarios) ? body.horarios.map(String) : [];
        setHorariosLivres(horarios);
        setForm(f => horarios.includes(f.horarioPreferido) ? f : { ...f, horarioPreferido: '' });
      })
      .catch(() => {
        if (ativo) setHorariosLivres(horariosDoDia);
      })
      .finally(() => {
        if (ativo) setConsultandoHorarios(false);
      });

    return () => { ativo = false; };
  }, [clinicaId, exigirDataAgendamento, form.dataPreferida, horariosDoDia, produtoId]);

  async function enviar() {
    if (exigirDataAgendamento) {
      if (!form.dataPreferida) {
        setErro('Selecione uma data disponível para continuar.');
        return;
      }
      if (!horariosParaEscolha.length) {
        setErro('Esta data não possui horários disponíveis para este produto.');
        return;
      }
      if (!form.horarioPreferido || !horariosParaEscolha.includes(form.horarioPreferido)) {
        setErro('Selecione um horário disponível para este produto.');
        return;
      }
    }

    setCarregando(true);
    setErro('');
    const response = await fetch('/api/catalogo/agendamentos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clinicaId, produtoId, ...form }),
    });
    const body = await response.json().catch(() => ({}));
    setCarregando(false);
    if (!response.ok) {
      setErro(body.error ?? 'Não foi possível iniciar o pagamento.');
      return;
    }
    if (body.paymentUrl) {
      window.location.href = body.paymentUrl;
      return;
    }
    setErro('Pedido criado, mas o pagamento online ainda não está configurado. Entre em contato com a clínica pelo WhatsApp.');
  }

  const podeEnviar = !!form.nome && !!form.telefone && (!exigirDataAgendamento || (!!form.dataPreferida && !!form.horarioPreferido));

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="inline-flex h-11 flex-1 items-center justify-center rounded-full px-5 text-sm font-bold text-white shadow-[0_14px_26px_rgba(29,158,117,0.22)] hover:brightness-95"
        style={{ background: cor }}
      >
        {exigirDataAgendamento ? 'Agendar' : 'Comprar'}
      </button>
      {whatsappHref && (
        <a
          href={whatsappHref}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-11 items-center justify-center rounded-full border border-[#155C47]/15 bg-[#FFFAF5] px-4 text-sm font-bold text-[#155C47] hover:bg-[#E8F7F1]"
          title="Falar no WhatsApp"
        >
          <MessageCircle className="h-4 w-4" />
        </a>
      )}
      {aberto && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/60 px-4 py-6">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  {exigirDataAgendamento ? 'Agendamento online' : 'Pagamento online'}
                </div>
                <h2 className="text-xl font-black text-slate-900">{produtoNome}</h2>
                {sinal != null && (
                  <p className="mt-1 text-sm text-slate-500">
                    {exigirDataAgendamento
                      ? 'Para solicitar o horário, o pagamento do sinal será necessário.'
                      : 'Após o pagamento, entre em contato pelo WhatsApp para combinar o melhor horário.'}
                  </p>
                )}
              </div>
              <button type="button" onClick={() => setAberto(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid gap-3">
              <Campo label="Nome completo *" value={form.nome} onChange={nome => setForm(f => ({ ...f, nome }))} />
              <Campo label="Telefone/WhatsApp *" value={form.telefone} onChange={telefone => setForm(f => ({ ...f, telefone }))} />
              <Campo label="E-mail" value={form.email} onChange={email => setForm(f => ({ ...f, email }))} type="email" />
              {exigirDataAgendamento && (
                <>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Campo
                      label="Data preferida"
                      value={form.dataPreferida}
                      onChange={dataPreferida => setForm(f => ({ ...f, dataPreferida, horarioPreferido: '' }))}
                      type="date"
                      min={hojeIso()}
                    />
                    <label className="text-xs font-semibold text-slate-600">
                      Horário disponível
                      <select
                        value={form.horarioPreferido}
                        onChange={e => setForm(f => ({ ...f, horarioPreferido: e.target.value }))}
                        className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
                        disabled={consultandoHorarios || !horariosParaEscolha.length}
                      >
                        <option value="">{consultandoHorarios ? 'Consultando...' : horariosParaEscolha.length ? 'Selecione' : 'Sem horários'}</option>
                        {horariosParaEscolha.map(horario => (
                          <option key={horario} value={horario}>{horario}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  {datasDisponiveis.length > 0 && (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                      <div className="mb-2 text-xs font-semibold text-slate-600">Datas abertas</div>
                      <div className="flex flex-wrap gap-2">
                        {datasDisponiveis.map(data => (
                          <button
                            key={data}
                            type="button"
                            onClick={() => setForm(f => ({ ...f, dataPreferida: data, horarioPreferido: '' }))}
                            className={`rounded-full border px-3 py-1 text-xs font-bold transition ${form.dataPreferida === data ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'}`}
                          >
                            {formatarData(data)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {datasDisponiveis.length === 0 && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                      Este produto ainda não possui datas abertas para agendamento.
                    </div>
                  )}
                  {form.dataPreferida && !consultandoHorarios && !horariosParaEscolha.length && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                      Este dia não possui horários disponíveis para este produto.
                    </div>
                  )}
                </>
              )}
              {!exigirDataAgendamento && whatsappHref && (
                <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                  Depois do pagamento, você poderá falar com a equipe pelo WhatsApp para confirmar o horário.
                </div>
              )}
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <div className="mb-2 font-bold text-slate-900">Resumo antes do pagamento</div>
                <div className="grid gap-1">
                  <div><b>Produto:</b> {produtoNome}</div>
                  {sinal != null && <div><b>Valor do pagamento:</b> {moeda(sinal)}</div>}
                  {form.dataPreferida && <div><b>Data:</b> {formatarData(form.dataPreferida)}</div>}
                  {form.horarioPreferido && <div><b>Horário:</b> {form.horarioPreferido}</div>}
                  {form.cupomCodigo && <div><b>Cupom:</b> {form.cupomCodigo.toUpperCase()}</div>}
                </div>
                <p className="mt-2 whitespace-pre-line text-slate-600">
                  {checkoutResumoTexto?.trim() || 'Seu horário ficará reservado por 15 minutos enquanto o pagamento é concluído.'}
                </p>
                {politicaPagamento?.trim() && (
                  <p className="mt-2 whitespace-pre-line rounded-lg bg-white px-3 py-2 text-xs text-slate-500">
                    {politicaPagamento}
                  </p>
                )}
              </div>
              <Campo
                label="Cupom de desconto"
                value={form.cupomCodigo}
                onChange={cupomCodigo => setForm(f => ({ ...f, cupomCodigo: cupomCodigo.toUpperCase() }))}
              />
              <label className="text-xs font-semibold text-slate-600">
                Observações
                <textarea
                  value={form.observacoes}
                  onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))}
                  className="mt-1 min-h-20 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </label>
            </div>
            {erro && <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">{erro}</div>}
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setAberto(false)} className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50">
                Cancelar
              </button>
              <button
                type="button"
                disabled={carregando || !podeEnviar}
                onClick={enviar}
                className="inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-bold text-white disabled:opacity-60"
                style={{ background: cor }}
              >
                {carregando && <Loader2 className="h-4 w-4 animate-spin" />}
                Continuar para pagamento
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Campo({ label, value, onChange, type = 'text', min }: { label: string; value: string; onChange: (value: string) => void; type?: string; min?: string }) {
  return (
    <label className="text-xs font-semibold text-slate-600">
      {label}
      <input
        type={type}
        min={min}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
      />
    </label>
  );
}

function horariosDisponiveis(data: string, agenda: Record<string, string[]>) {
  if (!data || !agenda || typeof agenda !== 'object') return [];
  const horarios = agenda[data];
  return Array.isArray(horarios) ? horarios.map(String).filter(Boolean).sort() : [];
}

function datasFuturasDisponiveis(agenda: Record<string, string[]>) {
  const hoje = hojeIso();
  if (!agenda || typeof agenda !== 'object') return [];
  return Object.entries(agenda)
    .filter(([data, horarios]) => /^\d{4}-\d{2}-\d{2}$/.test(data) && data >= hoje && Array.isArray(horarios) && horarios.length > 0)
    .map(([data]) => data)
    .sort();
}

function hojeIso() {
  const agora = new Date();
  const local = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), 12);
  return local.toISOString().slice(0, 10);
}

function formatarData(data: string) {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo' }).format(new Date(`${data}T12:00:00`));
}

function moeda(valor: number) {
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
