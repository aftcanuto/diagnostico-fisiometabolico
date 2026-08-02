import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CatalogoAgendamentoStatusPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const admin = createAdminClient();
  const { data } = await admin
    .from('catalogo_agendamentos')
    .select('id,produto_nome,cliente_nome,status,preco_total,valor_original_sinal,desconto_valor,valor_sinal,cupom_codigo,data_preferida,periodo_preferido,horario_preferido,clinicas(nome,telefone,email,endereco,site),catalogo_produtos(mensagem_pos_pagamento,politica_pagamento,pacote_itens)')
    .eq('id', id)
    .maybeSingle();
  if (!data) notFound();
  const clinica: any = Array.isArray(data.clinicas) ? data.clinicas[0] : data.clinicas;
  const pago = ['pagamento_recebido', 'confirmado'].includes(data.status);
  const temData = Boolean(data.data_preferida);
  const produto: any = Array.isArray(data.catalogo_produtos) ? data.catalogo_produtos[0] : data.catalogo_produtos;
  const mensagemPosPagamento = produto?.mensagem_pos_pagamento?.trim();
  const whatsapp = clinica?.telefone ? whatsappUrl(clinica.telefone, data, mensagemPosPagamento) : null;
  const calendarHref = data.data_preferida && data.horario_preferido ? googleCalendarUrl(data, clinica) : null;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className={`mx-auto mb-5 grid h-14 w-14 place-items-center rounded-full text-2xl ${pago ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
          {pago ? '✓' : '!'}
        </div>
        <h1 className="text-2xl font-black">{pago ? 'Pagamento recebido' : 'Pagamento pendente'}</h1>
        <p className="mt-3 text-slate-600">
          {pago
            ? mensagemPosPagamento || (temData
              ? 'Recebemos o sinal. A equipe entrará em contato para confirmar o melhor horário.'
              : 'Recebemos o pagamento. Agora entre em contato pelo WhatsApp para combinar o melhor horário.')
            : 'Seu pedido foi registrado, mas ainda não está confirmado sem o pagamento.'}
        </p>
        <div className="mt-6 rounded-2xl bg-slate-50 p-5 text-left text-sm">
          <div><b>Produto:</b> {data.produto_nome}</div>
          <div><b>Nome:</b> {data.cliente_nome}</div>
          <div><b>Valor pago:</b> {Number(data.valor_sinal).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
          {Number(data.desconto_valor ?? 0) > 0 && <div><b>Desconto:</b> {Number(data.desconto_valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} {data.cupom_codigo ? `(${data.cupom_codigo})` : ''}</div>}
          {data.data_preferida && <div><b>Data preferida:</b> {new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo' }).format(new Date(`${data.data_preferida}T12:00:00`))}</div>}
          {data.horario_preferido && <div><b>Horário:</b> {data.horario_preferido}</div>}
          {!data.horario_preferido && data.periodo_preferido && <div><b>Período:</b> {periodoLabel(data.periodo_preferido)}</div>}
          {!temData && <div><b>Próximo passo:</b> combinar data e horário pelo WhatsApp.</div>}
          {produto?.politica_pagamento && <div className="mt-3 border-t border-slate-200 pt-3"><b>Política:</b> {produto.politica_pagamento}</div>}
        </div>
        {Array.isArray(produto?.pacote_itens) && produto.pacote_itens.length > 0 && (
          <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-5 text-left text-sm">
            <b>Pacote inclui:</b>
            <ul className="mt-2 list-disc pl-5">
              {produto.pacote_itens.map((item: string) => <li key={item}>{item}</li>)}
            </ul>
          </div>
        )}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {whatsapp && <a href={whatsapp} target="_blank" rel="noreferrer" className="inline-flex rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-700">Chamar no WhatsApp</a>}
          {calendarHref && <a href={calendarHref} target="_blank" rel="noreferrer" className="inline-flex rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">Adicionar ao calendário</a>}
          <a href={`/api/catalogo/agendamentos/${data.id}/pdf`} target="_blank" rel="noreferrer" className="inline-flex rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">Baixar comprovante PDF</a>
        </div>
        {clinica && (
          <footer className="mt-6 text-xs leading-5 text-slate-500">
            <div className="font-semibold text-slate-700">{clinica.nome}</div>
            {[clinica.telefone, clinica.email, clinica.site, clinica.endereco].filter(Boolean).join(' · ')}
          </footer>
        )}
      </div>
    </main>
  );
}

function whatsappUrl(telefone: string, agendamento: any, mensagem?: string | null) {
  const digits = String(telefone).replace(/\D/g, '');
  if (!digits) return null;
  const numero = digits.startsWith('55') ? digits : `55${digits}`;
  const quando = agendamento.data_preferida
    ? ` para ${new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo' }).format(new Date(`${agendamento.data_preferida}T12:00:00`))}${agendamento.horario_preferido ? ` às ${agendamento.horario_preferido}` : ''}`
    : '';
  const texto = mensagem?.trim()
    ? `${mensagem}\n\nCliente: ${agendamento.cliente_nome}\nProduto: ${agendamento.produto_nome}${quando}`
    : `Olá, acabei de realizar o pagamento do produto ${agendamento.produto_nome}${quando}. Meu nome é ${agendamento.cliente_nome}.`;
  return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
}

function periodoLabel(periodo: string) {
  const labels: Record<string, string> = {
    manha: 'Manhã',
    tarde: 'Tarde',
    noite: 'Noite',
  };
  return labels[periodo] ?? periodo;
}

function googleCalendarUrl(agendamento: any, clinica: any) {
  const inicio = new Date(`${agendamento.data_preferida}T${agendamento.horario_preferido}:00-03:00`);
  const fim = new Date(inicio.getTime() + 60 * 60 * 1000);
  const format = (date: Date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${agendamento.produto_nome} - ${clinica?.nome ?? 'MedFit'}`,
    dates: `${format(inicio)}/${format(fim)}`,
    details: `Pedido da vitrine para ${agendamento.cliente_nome}.`,
    location: clinica?.endereco ?? '',
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
