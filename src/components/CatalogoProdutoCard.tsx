import { Check, Clock, MessageCircle, Package, Plus, Share2 } from 'lucide-react';
import { CatalogoAgendamentoButton } from '@/components/CatalogoAgendamentoButton';
import { CatalogoImagemEnquadrada } from '@/components/CatalogoImagemEnquadrada';

type Produto = {
  id: string;
  nome: string;
  subtitulo?: string | null;
  descricao?: string | null;
  selo?: string | null;
  preco?: number | string | null;
  preco_sob_consulta?: boolean | null;
  sinal_percentual?: number | string | null;
  duracao_minutos?: number | null;
  imagem_url?: string | null;
  imagem_posicao_x?: number | null;
  imagem_posicao_y?: number | null;
  imagem_zoom?: number | null;
  itens_inclusos?: unknown;
  beneficios?: unknown;
  pacote_itens?: unknown;
  whatsapp_texto?: string | null;
  destaque?: boolean | null;
  agenda_dias_semana?: number[] | null;
  agenda_periodos?: string[] | null;
  agenda_horarios?: Record<string, string[]> | null;
  exigir_data_agendamento?: boolean | null;
  checkout_resumo_texto?: string | null;
  politica_pagamento?: string | null;
  mensagem_pos_pagamento?: string | null;
};

type Props = {
  produto: Produto;
  clinicaId: string;
  telefone?: string | null;
  site?: string | null;
  email?: string | null;
  cor: string;
};

export function CatalogoProdutoCard({ produto, clinicaId, telefone, site, email, cor }: Props) {
  const beneficios = lista(produto.beneficios);
  const itens = lista(produto.itens_inclusos);
  const pacote = lista(produto.pacote_itens);
  const sobConsulta = !!produto.preco_sob_consulta;
  const preco = sobConsulta ? 'Sob consulta' : moeda(produto.preco);
  const sinal = sobConsulta ? null : valorSinal(produto);
  const contatoHref = hrefProduto(produto, telefone, site, email);
  return (
    <article
      id={`produto-${produto.id}`}
      className="group/card relative isolate flex h-[27rem] w-full self-start flex-col overflow-hidden rounded-lg border border-[#D9E0DA] bg-white shadow-[0_12px_32px_rgba(25,58,47,0.10)] transition-[transform,box-shadow,border-color] duration-300 has-[details[open]]:h-auto hover:-translate-y-1 hover:border-[#9FC8B8] hover:shadow-[0_22px_48px_rgba(25,58,47,0.16)] motion-reduce:transform-none"
    >
      <div className="relative aspect-[16/9] shrink-0 overflow-hidden border-b border-[#E4E9E5] bg-[#EEF1ED]">
        {produto.imagem_url ? (
          <div className="absolute inset-0 transition-transform duration-500 ease-out group-hover/card:scale-[1.02] motion-reduce:transform-none">
            <CatalogoImagemEnquadrada
              key={produto.imagem_url}
              src={produto.imagem_url}
              alt={`Imagem de ${produto.nome}`}
              posicaoX={produto.imagem_posicao_x}
              posicaoY={produto.imagem_posicao_y}
              zoom={produto.imagem_zoom}
            />
          </div>
        ) : (
          <div className="grid h-full place-items-center text-[#155C47]/25"><Package className="h-12 w-12" /></div>
        )}
        {(produto.selo || produto.destaque) ? (
          <span className="absolute left-3 top-3 rounded-md border border-white/80 bg-white/95 px-2.5 py-1 text-xs font-semibold text-[#155C47] shadow-[0_5px_16px_rgba(15,52,40,0.14)] backdrop-blur-sm">
            {produto.selo || 'Destaque'}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex min-h-14 items-start justify-between gap-4">
          <h2 className="line-clamp-2 min-w-0 font-serif text-[1.35rem] font-semibold leading-tight text-[#111713]">{produto.nome}</h2>
          {preco ? (
            <div className="shrink-0 rounded-md border border-[#DCEBE4] bg-[#F2F8F5] px-2 py-1 text-right text-sm font-bold text-[#155C47] shadow-[0_3px_10px_rgba(25,58,47,0.06)]">
              {preco}
            </div>
          ) : null}
        </div>
        <div className="mt-1 min-h-10">
          {produto.subtitulo ? <p className="line-clamp-2 text-sm leading-5 text-[#39715F]">{produto.subtitulo}</p> : null}
        </div>
        <div className="mt-3 min-h-5">
          {produto.duracao_minutos ? (
            <div className="inline-flex items-center gap-1.5 text-xs font-medium text-[#606963]">
              <Clock className="h-3.5 w-3.5" /> {produto.duracao_minutos} min
            </div>
          ) : null}
        </div>

        <details className="group mt-auto border-t border-[#E1E7E2] pt-1">
            <summary className="-mx-2 flex cursor-pointer list-none items-center justify-between rounded-md px-2 py-3 text-sm font-semibold text-[#155C47] transition-colors hover:bg-[#F1F7F4] [&::-webkit-details-marker]:hidden">
              <span>Saiba mais</span>
              <span className="grid h-7 w-7 place-items-center rounded-full border border-[#C8DCD3] bg-white shadow-[0_3px_10px_rgba(25,58,47,0.08)] transition-colors group-hover:bg-[#EAF5F0]">
                <Plus className="h-4 w-4 transition-transform duration-200 group-open:rotate-45" aria-hidden="true" />
              </span>
            </summary>
            <div className="pb-1">
              <div className="md:max-h-[28rem] md:overflow-y-auto md:overscroll-contain md:pr-2">
                {produto.descricao ? <p className="text-sm leading-6 text-[#59615C]">{produto.descricao}</p> : null}
                {itens.length > 0 ? <ListaRotulos titulo="Inclui" itens={itens} /> : null}
                {pacote.length > 0 ? <ListaChecks titulo="Pacote inclui" itens={pacote} cor={cor} /> : null}
                {beneficios.length > 0 ? <ListaChecks titulo="Benefícios" itens={beneficios} cor={cor} /> : null}
                {sinal != null ? (
                  <p className="mt-4 border-l-2 border-[#1D9E75] pl-3 text-sm text-[#39715F]">
                    {produto.exigir_data_agendamento !== false ? 'Agendamento mediante sinal de ' : 'Pagamento online de '}
                    <b>{moeda(sinal)}</b>
                  </p>
                ) : null}
                {!produto.descricao && itens.length === 0 && pacote.length === 0 && beneficios.length === 0 ? (
                  <p className="text-sm leading-6 text-[#59615C]">Fale com a equipe para conhecer todos os detalhes deste serviço.</p>
                ) : null}
              </div>
              <div className="mt-5 flex gap-2 border-t border-[#E8E4DD] pt-4">
                {sobConsulta && contatoHref ? (
                  <a
                    href={contatoHref}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-md bg-[#155C47] px-4 text-sm font-semibold text-white hover:bg-[#104936]"
                  >
                    <MessageCircle className="h-4 w-4" /> Consultar
                  </a>
                ) : contatoHref ? (
                  <CatalogoAgendamentoButton
                    clinicaId={clinicaId}
                    produtoId={produto.id}
                    produtoNome={produto.nome}
                    sinal={sinal}
                    cor={cor}
                    whatsappHref={contatoHref}
                    agendaDiasSemana={produto.agenda_dias_semana ?? []}
                    agendaPeriodos={produto.agenda_periodos ?? []}
                    agendaHorarios={produto.agenda_horarios ?? {}}
                    exigirDataAgendamento={produto.exigir_data_agendamento !== false}
                    checkoutResumoTexto={produto.checkout_resumo_texto}
                    politicaPagamento={produto.politica_pagamento}
                    mensagemPosPagamento={produto.mensagem_pos_pagamento}
                  />
                ) : null}
                <a
                  href={`/catalogo#produto-${produto.id}`}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[#CFD8D2] text-[#155C47] hover:bg-[#EEF6F1]"
                  title="Compartilhar produto"
                >
                  <Share2 className="h-4 w-4" />
                </a>
              </div>
            </div>
          </details>
      </div>
    </article>
  );
}

function ListaRotulos({ titulo, itens }: { titulo: string; itens: string[] }) {
  return (
    <div className="mt-4">
      <div className="text-xs font-bold uppercase text-[#737A75]">{titulo}</div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {itens.map((item, index) => <span key={`${item}-${index}`} className="rounded-md bg-[#F1F2EF] px-2.5 py-1 text-xs text-[#59615C]">{item}</span>)}
      </div>
    </div>
  );
}

function ListaChecks({ titulo, itens, cor }: { titulo: string; itens: string[]; cor: string }) {
  return (
    <div className="mt-4">
      <div className="text-xs font-bold uppercase text-[#737A75]">{titulo}</div>
      <ul className="mt-2 space-y-2 text-sm text-[#59615C]">
        {itens.map((item, index) => (
          <li key={`${item}-${index}`} className="flex gap-2">
            <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: cor }} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function lista(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(item => String(item).trim()).filter(Boolean);
  if (typeof value !== 'string') return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.map(item => String(item).trim()).filter(Boolean);
  } catch {}
  return value.split('\n').map(item => item.trim()).filter(Boolean);
}

function hrefProduto(produto: Produto, telefone?: string | null, site?: string | null, email?: string | null) {
  const digits = String(telefone ?? '').replace(/\D/g, '');
  if (digits) {
    const numero = digits.startsWith('55') ? digits : `55${digits}`;
    const texto = produto.whatsapp_texto?.trim() || `Olá, tenho interesse em agendar: ${produto.nome}.`;
    return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
  }
  if (site) return /^https?:\/\//.test(site) ? site : `https://${site}`;
  return email ? `mailto:${email}` : null;
}

function moeda(valor?: number | string | null) {
  if (valor === null || valor === undefined || valor === '') return null;
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : null;
}

function valorSinal(produto: Produto) {
  const preco = Number(produto.preco);
  const percentual = Number(produto.sinal_percentual);
  if (!Number.isFinite(preco) || !Number.isFinite(percentual) || percentual <= 0) return null;
  return preco * percentual / 100;
}
