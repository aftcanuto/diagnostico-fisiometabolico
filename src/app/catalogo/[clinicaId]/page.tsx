import { notFound } from 'next/navigation';
import { Check, Clock, Mail, MapPin, MessageCircle, Package, Share2 } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/server';
import { CatalogoAgendamentoButton } from '@/components/CatalogoAgendamentoButton';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Produto = {
  id: string;
  nome: string;
  subtitulo?: string | null;
  descricao?: string | null;
  selo?: string | null;
  preco?: number | string | null;
  sinal_percentual?: number | string | null;
  duracao_minutos?: number | null;
  imagem_url?: string | null;
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

type Clinica = {
  id: string;
  nome: string;
  logo_url?: string | null;
  telefone?: string | null;
  email?: string | null;
  site?: string | null;
  instagram?: string | null;
  endereco?: string | null;
  cor_primaria?: string | null;
  cor_secundaria?: string | null;
  catalogo_titulo?: string | null;
  catalogo_subtitulo?: string | null;
  catalogo_rodape_titulo?: string | null;
  catalogo_rodape_texto?: string | null;
};

function normalizarUrl(url?: string | null) {
  if (!url) return null;
  const clean = String(url).trim();
  if (!clean) return null;
  if (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('mailto:')) return clean;
  return `https://${clean}`;
}

function normalizarInstagram(valor?: string | null, nomeClinica?: string | null) {
  const clean = String(valor ?? '').trim();
  if (!clean) return null;
  const lower = clean.toLowerCase();
  if (lower.includes('instagram.com/')) return normalizarUrl(clean);
  if (clean.startsWith('@')) return `https://www.instagram.com/${clean.slice(1)}`;
  if (!clean.includes('.') && !clean.includes('/')) return `https://www.instagram.com/${clean}`;
  if (nomeClinica?.toLowerCase().includes('medfit') && lower.includes('medfit')) {
    return 'https://www.instagram.com/medfitsaude';
  }
  return normalizarUrl(clean);
}

function whatsappUrl(telefone?: string | null) {
  const digits = String(telefone ?? '').replace(/\D/g, '');
  if (!digits) return null;
  const numero = digits.startsWith('55') ? digits : `55${digits}`;
  return `https://wa.me/${numero}`;
}

function moeda(valor?: number | string | null) {
  if (valor === null || valor === undefined || valor === '') return null;
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return null;
  return numero.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function listaBeneficios(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(item => String(item).trim()).filter(Boolean);
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map(item => String(item).trim()).filter(Boolean);
    } catch {}
    return value.split('\n').map(item => item.trim()).filter(Boolean);
  }
  return [];
}

function hrefProduto(produto: Produto, clinica: Clinica) {
  const whatsapp = whatsappUrl(clinica.telefone);
  if (!whatsapp) return normalizarUrl(clinica.site) ?? (clinica.email ? `mailto:${clinica.email}` : null);
  const texto = produto.whatsapp_texto?.trim()
    || `Olá, tenho interesse em agendar: ${produto.nome}.`;
  return `${whatsapp}?text=${encodeURIComponent(texto)}`;
}

function valorSinal(produto: Produto) {
  const preco = Number(produto.preco);
  const pct = Number(produto.sinal_percentual);
  if (!Number.isFinite(preco) || !Number.isFinite(pct) || pct <= 0) return null;
  return preco * pct / 100;
}

export default async function CatalogoPage(props: { params: Promise<{ clinicaId: string }> }) {
  const params = await props.params;
  const admin = createAdminClient();
  const { data: clinica } = await admin
    .from('clinicas')
    .select('id,nome,logo_url,telefone,email,site,instagram,endereco,cor_primaria,cor_secundaria,catalogo_titulo,catalogo_subtitulo,catalogo_rodape_titulo,catalogo_rodape_texto')
    .eq('id', params.clinicaId)
    .maybeSingle();

  if (!clinica) notFound();

  const { data: produtos } = await admin
    .from('catalogo_produtos')
    .select('id,nome,subtitulo,descricao,selo,preco,sinal_percentual,duracao_minutos,imagem_url,itens_inclusos,beneficios,pacote_itens,whatsapp_texto,destaque,ativo,ordem,agenda_dias_semana,agenda_periodos,agenda_horarios,exigir_data_agendamento,checkout_resumo_texto,politica_pagamento,mensagem_pos_pagamento')
    .eq('clinica_id', params.clinicaId)
    .eq('ativo', true)
    .order('destaque', { ascending: false })
    .order('ordem')
    .order('nome');

  const pri = '#1D9E75';
  const site = normalizarUrl(clinica.site);
  const whatsapp = whatsappUrl(clinica.telefone);
  const instagram = normalizarInstagram(clinica.instagram, clinica.nome);
  const tituloCatalogo = clinica.catalogo_titulo?.trim() || 'Escolha o produto ideal para sua avaliação';
  const subtituloCatalogo = clinica.catalogo_subtitulo?.trim()
    || 'Conheca os servicos disponiveis, veja beneficios, valores e fale com a equipe para agendar ou tirar duvidas.';
  const rodapeTitulo = clinica.catalogo_rodape_titulo?.trim() || clinica.nome;
  const rodapeTexto = clinica.catalogo_rodape_texto?.trim() || clinica.endereco;

  return (
    <main className="min-h-screen bg-[#F0EAE0] text-[#0C0C0C]">
      <section className="border-b border-[#E5DDD2] bg-[#FAF5EF]/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-3">
            {clinica.logo_url ? (
              <img src={clinica.logo_url} alt="" className="h-12 w-12 rounded-2xl border border-[#E5DDD2] bg-white object-contain shadow-sm" />
            ) : (
              <div className="grid h-12 w-12 place-items-center rounded-2xl text-white shadow-sm" style={{ background: pri }}>
                {clinica.nome?.charAt(0) || 'D'}
              </div>
            )}
            <div>
              <div className="font-semibold tracking-[-0.02em]">{clinica.nome}</div>
              <div className="text-xs text-[#5A5A5A]">Produtos e servicos</div>
            </div>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            {whatsapp && <a className="rounded-full border border-[#155C47]/15 bg-[#FFFAF5] px-4 py-2 text-sm font-semibold text-[#155C47] shadow-sm hover:bg-[#E8F7F1]" href={whatsapp} target="_blank" rel="noreferrer">WhatsApp</a>}
            {site && <a className="rounded-full border border-[#155C47]/15 bg-[#FFFAF5] px-4 py-2 text-sm font-semibold text-[#155C47] shadow-sm hover:bg-[#E8F7F1]" href={site} target="_blank" rel="noreferrer">Site</a>}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-10">
        <div className="relative overflow-hidden rounded-[2rem] border border-[#E5DDD2] bg-[#FAF5EF] p-8 shadow-[0_22px_50px_rgba(21,92,71,0.09)] md:p-10">
          <div className="pointer-events-none absolute -right-20 -top-28 h-80 w-80 rounded-full bg-[#1D9E75]/15 blur-2xl" />
          <div className="relative max-w-3xl">
            <p className="mb-4 inline-flex rounded-full bg-[#E8F7F1] px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#155C47]">Catálogo da clínica</p>
            <h1 className="font-serif text-4xl font-semibold leading-[0.98] tracking-[-0.045em] text-[#0C0C0C] md:text-6xl">{tituloCatalogo}</h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-[#5A5A5A] md:text-base">
              {subtituloCatalogo}
            </p>
          </div>
        </div>

        {!produtos?.length ? (
          <div className="mt-8 rounded-[1.75rem] border border-[#E5DDD2] bg-[#FAF5EF] p-10 text-center text-[#5A5A5A] shadow-sm">
            Nenhum produto ativo cadastrado no momento.
          </div>
        ) : (
          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {produtos.map((produto: Produto) => {
              const beneficios = listaBeneficios(produto.beneficios);
              const itens = listaBeneficios(produto.itens_inclusos);
              const pacote = listaBeneficios(produto.pacote_itens);
              const preco = moeda(produto.preco);
              const sinal = valorSinal(produto);
              const ctaHref = hrefProduto(produto, clinica);
              const shareUrl = `/catalogo#produto-${produto.id}`;
              return (
                <article key={produto.id} id={`produto-${produto.id}`} className="relative flex min-h-full flex-col overflow-hidden rounded-[1.75rem] border border-[#E5DDD2] bg-[#FFFAF5] shadow-[0_18px_44px_rgba(12,12,12,0.06)]">
                  <div className="group relative m-3 h-48 overflow-visible rounded-[1.4rem] bg-[#E5DDD2]">
                    {produto.imagem_url ? (
                      <>
                        <img src={produto.imagem_url} alt="" className="h-full w-full rounded-[1.4rem] object-cover" />
                        <div className="pointer-events-none absolute left-1/2 top-3 z-40 hidden w-80 max-w-[calc(100vw-32px)] -translate-x-1/2 rounded-[1.4rem] border border-[#E5DDD2] bg-[#FFFAF5] p-2 shadow-2xl ring-1 ring-[#0C0C0C]/5 group-hover:block">
                          <img src={produto.imagem_url} alt={`Imagem completa de ${produto.nome}`} className="max-h-96 w-full rounded-[1rem] object-contain" />
                        </div>
                      </>
                    ) : (
                      <div className="grid h-full place-items-center text-[#155C47]/25">
                        <Package className="h-14 w-14" />
                      </div>
                    )}
                    {(produto.selo || produto.destaque) && (
                      <span className="absolute left-4 top-4 rounded-full bg-[#E8F7F1]/95 px-3 py-1 text-xs font-bold text-[#155C47] shadow-sm">{produto.selo || 'Destaque'}</span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col px-6 pb-6 pt-3">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="font-serif text-2xl font-semibold leading-tight tracking-[-0.035em] text-[#0C0C0C]">{produto.nome}</h2>
                      {preco && <div className="shrink-0 text-right text-lg font-bold text-[#155C47]">{preco}</div>}
                    </div>
                    {produto.subtitulo && <p className="mt-2 text-sm font-semibold text-[#1D9E75]">{produto.subtitulo}</p>}
                    {produto.descricao && <p className="mt-3 text-sm leading-6 text-[#5A5A5A]">{produto.descricao}</p>}
                    {sinal != null && (
                      <div className="mt-4 rounded-2xl border border-[#1D9E75]/15 bg-[#E8F7F1] px-4 py-3 text-sm text-[#155C47]">
                        {produto.exigir_data_agendamento !== false ? 'Agendamento mediante sinal de ' : 'Pagamento online de '}
                        <b>{moeda(sinal)}</b>
                      </div>
                    )}
                    {produto.duracao_minutos && (
                      <div className="mt-4 inline-flex w-fit items-center gap-2 rounded-full bg-[#F0EAE0] px-3 py-1 text-xs font-semibold text-[#5A5A5A]">
                        <Clock className="h-3.5 w-3.5" />
                        {produto.duracao_minutos} min
                      </div>
                    )}
                    {itens.length > 0 && (
                      <div className="mt-5">
                        <div className="text-xs font-bold uppercase tracking-wide text-[#5A5A5A]/60">Inclui</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {itens.map((item, index) => <span key={`${produto.id}-item-${index}`} className="rounded-full bg-[#F0EAE0] px-3 py-1 text-xs font-semibold text-[#5A5A5A]">{item}</span>)}
                        </div>
                      </div>
                    )}
                    {pacote.length > 0 && (
                      <div className="mt-5 rounded-2xl border border-[#1D9E75]/15 bg-[#E8F7F1] px-4 py-3">
                        <div className="text-xs font-bold uppercase tracking-wide text-[#155C47]">Pacote inclui</div>
                        <ul className="mt-2 space-y-1 text-sm text-[#5A5A5A]">
                          {pacote.map((item, index) => (
                            <li key={`${produto.id}-pacote-${index}`} className="flex gap-2">
                              <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: pri }} />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {beneficios.length > 0 && (
                      <ul className="mt-5 space-y-2 text-sm text-[#5A5A5A]">
                        {beneficios.map((beneficio, index) => (
                          <li key={`${produto.id}-${index}`} className="flex gap-2">
                            <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: pri }} />
                            <span>{beneficio}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="mt-auto flex flex-wrap gap-2 pt-6">
                      {ctaHref && (
                        <CatalogoAgendamentoButton
                          clinicaId={params.clinicaId}
                          produtoId={produto.id}
                          produtoNome={produto.nome}
                          sinal={sinal}
                          cor={pri}
                          whatsappHref={ctaHref}
                          agendaDiasSemana={produto.agenda_dias_semana ?? []}
                          agendaPeriodos={produto.agenda_periodos ?? []}
                          agendaHorarios={produto.agenda_horarios ?? {}}
                          exigirDataAgendamento={produto.exigir_data_agendamento !== false}
                          checkoutResumoTexto={produto.checkout_resumo_texto}
                          politicaPagamento={produto.politica_pagamento}
                          mensagemPosPagamento={produto.mensagem_pos_pagamento}
                        />
                      )}
                      <a
                        href={shareUrl}
                        className="inline-flex h-11 items-center justify-center rounded-full border border-[#155C47]/15 bg-[#FFFAF5] px-4 text-sm font-bold text-[#155C47] hover:bg-[#E8F7F1]"
                        title="Compartilhar produto"
                      >
                        <Share2 className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <section className="mt-10 rounded-[1.75rem] border border-[#E5DDD2] bg-[#FAF5EF] p-7 shadow-[0_18px_44px_rgba(12,12,12,0.045)]">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-serif text-3xl font-semibold tracking-[-0.035em] text-[#0C0C0C]">{rodapeTitulo}</h2>
              {rodapeTexto && <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5A5A5A]">{rodapeTexto}</p>}
            </div>
            <div className="flex flex-wrap gap-2">
              {whatsapp && <a className="inline-flex items-center gap-2 rounded-full border border-[#155C47]/15 bg-[#FFFAF5] px-4 py-2 text-sm font-bold text-[#155C47] hover:bg-[#E8F7F1]" href={whatsapp} target="_blank" rel="noreferrer"><MessageCircle className="h-4 w-4" /> WhatsApp</a>}
              {clinica.email && <a className="inline-flex items-center gap-2 rounded-full border border-[#155C47]/15 bg-[#FFFAF5] px-4 py-2 text-sm font-bold text-[#155C47] hover:bg-[#E8F7F1]" href={`mailto:${clinica.email}`}><Mail className="h-4 w-4" /> E-mail</a>}
              {site && <a className="inline-flex items-center gap-2 rounded-full border border-[#155C47]/15 bg-[#FFFAF5] px-4 py-2 text-sm font-bold text-[#155C47] hover:bg-[#E8F7F1]" href={site} target="_blank" rel="noreferrer">Site</a>}
              {instagram && <a className="inline-flex items-center gap-2 rounded-full border border-[#155C47]/15 bg-[#FFFAF5] px-4 py-2 text-sm font-bold text-[#155C47] hover:bg-[#E8F7F1]" href={instagram} target="_blank" rel="noreferrer">Instagram</a>}
              {clinica.endereco && <a className="inline-flex items-center gap-2 rounded-full border border-[#155C47]/15 bg-[#FFFAF5] px-4 py-2 text-sm font-bold text-[#155C47] hover:bg-[#E8F7F1]" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clinica.endereco)}`} target="_blank" rel="noreferrer"><MapPin className="h-4 w-4" /> Endereco</a>}
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
