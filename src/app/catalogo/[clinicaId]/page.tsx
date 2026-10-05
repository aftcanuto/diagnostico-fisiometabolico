import { notFound } from 'next/navigation';
import { Mail, MapPin, MessageCircle } from 'lucide-react';
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
    .select('id,nome,subtitulo,descricao,selo,preco,preco_sob_consulta,sinal_percentual,duracao_minutos,imagem_url,imagem_posicao_x,imagem_posicao_y,itens_inclusos,beneficios,pacote_itens,whatsapp_texto,destaque,ativo,ordem,agenda_dias_semana,agenda_periodos,agenda_horarios,exigir_data_agendamento,checkout_resumo_texto,politica_pagamento,mensagem_pos_pagamento')
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

        <section className="mt-12 border-t border-[#DCE2DD] py-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-serif text-3xl font-semibold tracking-[-0.035em] text-[#0C0C0C]">{rodapeTitulo}</h2>
              {rodapeTexto && <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5A5A5A]">{rodapeTexto}</p>}
            </div>
            <div className="flex flex-wrap gap-2">
              {whatsapp && <a className="inline-flex items-center gap-2 rounded-md border border-[#CFD8D2] bg-white px-4 py-2 text-sm font-semibold text-[#155C47] hover:bg-[#EEF6F1]" href={whatsapp} target="_blank" rel="noreferrer"><MessageCircle className="h-4 w-4" /> WhatsApp</a>}
              {clinica.email && <a className="inline-flex items-center gap-2 rounded-md border border-[#CFD8D2] bg-white px-4 py-2 text-sm font-semibold text-[#155C47] hover:bg-[#EEF6F1]" href={`mailto:${clinica.email}`}><Mail className="h-4 w-4" /> E-mail</a>}
              {site && <a className="inline-flex items-center gap-2 rounded-md border border-[#CFD8D2] bg-white px-4 py-2 text-sm font-semibold text-[#155C47] hover:bg-[#EEF6F1]" href={site} target="_blank" rel="noreferrer">Site</a>}
              {instagram && <a className="inline-flex items-center gap-2 rounded-md border border-[#CFD8D2] bg-white px-4 py-2 text-sm font-semibold text-[#155C47] hover:bg-[#EEF6F1]" href={instagram} target="_blank" rel="noreferrer">Instagram</a>}
              {clinica.endereco && <a className="inline-flex items-center gap-2 rounded-md border border-[#CFD8D2] bg-white px-4 py-2 text-sm font-semibold text-[#155C47] hover:bg-[#EEF6F1]" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clinica.endereco)}`} target="_blank" rel="noreferrer"><MapPin className="h-4 w-4" /> Endereço</a>}
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
