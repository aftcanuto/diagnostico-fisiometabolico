import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { Globe2, Instagram, Mail, MapPin, MessageCircle } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/server';
import { CatalogoProdutoCard } from '@/components/CatalogoProdutoCard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
    .select('id,nome,subtitulo,descricao,selo,preco,preco_sob_consulta,sinal_percentual,duracao_minutos,imagem_url,imagem_posicao_x,imagem_posicao_y,imagem_zoom,itens_inclusos,beneficios,pacote_itens,whatsapp_texto,destaque,ativo,ordem,agenda_dias_semana,agenda_periodos,agenda_horarios,exigir_data_agendamento,checkout_resumo_texto,politica_pagamento,mensagem_pos_pagamento')
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
    <main className="min-h-screen bg-[#F5F6F3] text-[#0C0C0C]">
      <section className="border-b border-[#DFE4DF] bg-white">
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
              <div className="text-xs text-[#5A5A5A]">Produtos e serviços</div>
            </div>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            {whatsapp && <a className="rounded-full border border-[#155C47]/15 bg-[#FFFAF5] px-4 py-2 text-sm font-semibold text-[#155C47] shadow-sm hover:bg-[#E8F7F1]" href={whatsapp} target="_blank" rel="noreferrer">WhatsApp</a>}
            {site && <a className="rounded-full border border-[#155C47]/15 bg-[#FFFAF5] px-4 py-2 text-sm font-semibold text-[#155C47] shadow-sm hover:bg-[#E8F7F1]" href={site} target="_blank" rel="noreferrer">Site</a>}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-10 md:py-14">
        <div className="max-w-3xl border-l-4 border-[#1D9E75] pl-5 md:pl-7">
            <p className="mb-3 text-xs font-bold uppercase text-[#155C47]">Catálogo da clínica</p>
            <h1 className="font-serif text-4xl font-semibold leading-tight text-[#111713] md:text-5xl">{tituloCatalogo}</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#5A5A5A] md:text-base">
              {subtituloCatalogo}
            </p>
        </div>

        {!produtos?.length ? (
          <div className="mt-8 rounded-lg border border-[#DFE4DF] bg-white p-10 text-center text-[#5A5A5A]">
            Nenhum produto ativo cadastrado no momento.
          </div>
        ) : (
          <div className="mt-10 grid items-start gap-5 md:grid-cols-2 xl:grid-cols-3">
            {produtos.map((produto: Produto) => (
              <CatalogoProdutoCard
                key={produto.id}
                produto={produto}
                clinicaId={params.clinicaId}
                telefone={clinica.telefone}
                site={clinica.site}
                email={clinica.email}
                cor={pri}
              />
            ))}
          </div>
        )}

      </section>

      <footer className="mt-10 border-t-2 border-[#29A77D] bg-[#153B31] text-white">
        <div className="mx-auto max-w-6xl px-5 py-5 md:py-6">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
            <div>
              <p className="text-[10px] font-bold uppercase text-[#9DDBC3]">MedFit Saúde e Bem-estar</p>
              <h2 className="mt-1 max-w-xl font-serif text-xl font-semibold leading-tight md:text-2xl">{rodapeTitulo}</h2>
              {rodapeTexto && <p className="mt-1 max-w-2xl text-xs leading-5 text-white/70">{rodapeTexto}</p>}
            </div>
            <nav aria-label="Contatos da clínica" className="flex flex-nowrap items-center gap-0.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-1 md:max-w-xl md:justify-end md:overflow-visible md:pb-0">
              {whatsapp && <FooterLink href={whatsapp} label="WhatsApp" icon={<MessageCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3" />} />}
              {clinica.email && <FooterLink href={`mailto:${clinica.email}`} label="E-mail" icon={<Mail className="h-2.5 w-2.5 sm:h-3 sm:w-3" />} external={false} />}
              {site && <FooterLink href={site} label="Site" icon={<Globe2 className="h-2.5 w-2.5 sm:h-3 sm:w-3" />} />}
              {instagram && <FooterLink href={instagram} label="Instagram" icon={<Instagram className="h-2.5 w-2.5 sm:h-3 sm:w-3" />} />}
              {clinica.endereco && <FooterLink href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clinica.endereco)}`} label="Como chegar" mobileLabel="Mapa" icon={<MapPin className="h-2.5 w-2.5 sm:h-3 sm:w-3" />} />}
            </nav>
          </div>
          <div className="mt-4 flex flex-row flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-white/15 pt-2.5 text-[9px] text-white/55">
            <span>{clinica.nome} · Produtos e serviços</span>
            <span>Avaliar. Entender. Evoluir.</span>
          </div>
        </div>
      </footer>
    </main>
  );
}

function FooterLink({ href, label, mobileLabel, icon, external = true }: { href: string; label: string; mobileLabel?: string; icon: ReactNode; external?: boolean }) {
  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noreferrer' : undefined}
      className="inline-flex min-h-7 flex-none items-center gap-1 rounded-md border border-white/12 bg-white/[0.04] px-1 py-1 text-[9px] font-medium text-white/90 transition-[transform,background-color,border-color] hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.09] motion-reduce:transform-none max-[359px]:gap-0.5 max-[359px]:px-0.5 sm:min-h-8 sm:gap-1.5 sm:px-2.5 sm:py-1.5 sm:text-[11px]"
    >
      <span className="inline-flex items-center gap-1 sm:gap-1.5">
        {icon}
        {mobileLabel ? <><span className="sm:hidden">{mobileLabel}</span><span className="hidden sm:inline">{label}</span></> : label}
      </span>
    </a>
  );
}
