import { notFound } from 'next/navigation';
import { Check, Clock, Mail, MapPin, MessageCircle, Package, Share2 } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Produto = {
  id: string;
  nome: string;
  descricao?: string | null;
  preco?: number | string | null;
  duracao_minutos?: number | null;
  imagem_url?: string | null;
  beneficios?: unknown;
  cta_texto?: string | null;
  cta_url?: string | null;
  destaque_comercial?: boolean | null;
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
};

function normalizarUrl(url?: string | null) {
  if (!url) return null;
  const clean = String(url).trim();
  if (!clean) return null;
  if (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('mailto:')) return clean;
  return `https://${clean}`;
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
  return normalizarUrl(produto.cta_url)
    ?? whatsappUrl(clinica.telefone)
    ?? normalizarUrl(clinica.site)
    ?? (clinica.email ? `mailto:${clinica.email}` : null);
}

export default async function CatalogoPage({ params }: { params: { clinicaId: string } }) {
  const admin = createAdminClient();
  const { data: clinica } = await admin
    .from('clinicas')
    .select('id,nome,logo_url,telefone,email,site,instagram,endereco,cor_primaria,cor_secundaria')
    .eq('id', params.clinicaId)
    .maybeSingle();

  if (!clinica) notFound();

  const { data: produtos } = await admin
    .from('produtos')
    .select('id,nome,descricao,preco,duracao_minutos,imagem_url,beneficios,cta_texto,cta_url,destaque_comercial,ativo,padrao')
    .eq('clinica_id', params.clinicaId)
    .eq('ativo', true)
    .order('destaque_comercial', { ascending: false })
    .order('padrao', { ascending: false })
    .order('nome');

  const pri = clinica.cor_primaria || '#047857';
  const sec = clinica.cor_secundaria || '#0f766e';
  const site = normalizarUrl(clinica.site);
  const whatsapp = whatsappUrl(clinica.telefone);
  const instagram = clinica.instagram
    ? normalizarUrl(clinica.instagram.startsWith('@') ? `instagram.com/${clinica.instagram.slice(1)}` : clinica.instagram)
    : null;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-3">
            {clinica.logo_url ? (
              <img src={clinica.logo_url} alt="" className="h-11 w-11 rounded-xl border border-slate-200 bg-white object-contain" />
            ) : (
              <div className="grid h-11 w-11 place-items-center rounded-xl text-white" style={{ background: pri }}>
                {clinica.nome?.charAt(0) || 'D'}
              </div>
            )}
            <div>
              <div className="font-bold">{clinica.nome}</div>
              <div className="text-xs text-slate-500">Produtos e servicos</div>
            </div>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            {whatsapp && <a className="rounded-full border border-slate-200 px-3 py-2 text-sm font-semibold hover:bg-slate-50" href={whatsapp} target="_blank" rel="noreferrer">WhatsApp</a>}
            {site && <a className="rounded-full border border-slate-200 px-3 py-2 text-sm font-semibold hover:bg-slate-50" href={site} target="_blank" rel="noreferrer">Site</a>}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-10">
        <div className="overflow-hidden rounded-3xl p-8 text-white shadow-xl" style={{ background: `linear-gradient(135deg, ${pri}, ${sec})` }}>
          <div className="max-w-3xl">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-white/75">Catalogo da clinica</p>
            <h1 className="text-3xl font-black leading-tight md:text-5xl">Escolha o produto ideal para sua avaliacao</h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/85 md:text-base">
              Conheca os servicos disponiveis, veja beneficios, valores e fale com a equipe para agendar ou tirar duvidas.
            </p>
          </div>
        </div>

        {!produtos?.length ? (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
            Nenhum produto ativo cadastrado no momento.
          </div>
        ) : (
          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {produtos.map((produto: Produto) => {
              const beneficios = listaBeneficios(produto.beneficios);
              const preco = moeda(produto.preco);
              const ctaHref = hrefProduto(produto, clinica);
              const shareUrl = `/catalogo/${params.clinicaId}#produto-${produto.id}`;
              return (
                <article key={produto.id} id={`produto-${produto.id}`} className="flex min-h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="relative h-44 bg-slate-100">
                    {produto.imagem_url ? (
                      <img src={produto.imagem_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="grid h-full place-items-center text-slate-300">
                        <Package className="h-14 w-14" />
                      </div>
                    )}
                    {produto.destaque_comercial && (
                      <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-xs font-bold" style={{ color: pri }}>Destaque</span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="text-xl font-black leading-tight">{produto.nome}</h2>
                      {preco && <div className="shrink-0 text-right text-lg font-black" style={{ color: pri }}>{preco}</div>}
                    </div>
                    {produto.descricao && <p className="mt-3 text-sm leading-6 text-slate-600">{produto.descricao}</p>}
                    {produto.duracao_minutos && (
                      <div className="mt-4 inline-flex w-fit items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        <Clock className="h-3.5 w-3.5" />
                        {produto.duracao_minutos} min
                      </div>
                    )}
                    {beneficios.length > 0 && (
                      <ul className="mt-5 space-y-2 text-sm text-slate-700">
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
                        <a
                          href={ctaHref}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-10 flex-1 items-center justify-center rounded-xl px-4 text-sm font-bold text-white"
                          style={{ background: pri }}
                        >
                          {produto.cta_texto || 'Tenho interesse'}
                        </a>
                      )}
                      <a
                        href={shareUrl}
                        className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 px-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
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

        <section className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-black">{clinica.nome}</h2>
              {clinica.endereco && <p className="mt-1 text-sm text-slate-500">{clinica.endereco}</p>}
            </div>
            <div className="flex flex-wrap gap-2">
              {whatsapp && <a className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-bold hover:bg-slate-50" href={whatsapp} target="_blank" rel="noreferrer"><MessageCircle className="h-4 w-4" /> WhatsApp</a>}
              {clinica.email && <a className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-bold hover:bg-slate-50" href={`mailto:${clinica.email}`}><Mail className="h-4 w-4" /> E-mail</a>}
              {site && <a className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-bold hover:bg-slate-50" href={site} target="_blank" rel="noreferrer">Site</a>}
              {instagram && <a className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-bold hover:bg-slate-50" href={instagram} target="_blank" rel="noreferrer">Instagram</a>}
              {clinica.endereco && <a className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-bold hover:bg-slate-50" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clinica.endereco)}`} target="_blank" rel="noreferrer"><MapPin className="h-4 w-4" /> Endereco</a>}
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
