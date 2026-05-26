import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProductCatalogShareButton } from '@/components/ProductCatalogShareButton';
import { Plus, Package, Check, ExternalLink, Settings } from 'lucide-react';

const MODULOS_META: Record<string, string> = {
  anamnese: 'Anamnese',
  sinais_vitais: 'Sinais vitais',
  posturografia: 'Posturografia',
  bioimpedancia: 'Bioimpedancia',
  antropometria: 'Antropometria',
  flexibilidade: 'Flexibilidade',
  forca: 'Forca',
  rml: 'RML',
  cardiorrespiratorio: 'Cardio',
  biomecanica_corrida: 'Biomecanica da corrida',
};

export default async function ProdutosPage() {
  const supabase = createClient();
  const { data: clinicaId } = await supabase.rpc('current_clinica_id');
  const { data: produtos } = await supabase.from('produtos')
    .select('*')
    .order('destaque_comercial', { ascending: false })
    .order('padrao', { ascending: false })
    .order('nome');
  const catalogoHref = clinicaId ? `/catalogo/${clinicaId}` : '/produtos';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Produtos</h1>
          <p className="text-sm text-slate-500">Pacotes, servicos e produtos oferecidos pela sua clinica</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {clinicaId && (
            <>
              <ProductCatalogShareButton href={catalogoHref} />
              <Link href="/produtos/catalogo">
                <Button variant="secondary"><Settings className="w-4 h-4" /> Configurar vitrine</Button>
              </Link>
              <Link href={catalogoHref} target="_blank">
                <Button variant="secondary"><ExternalLink className="w-4 h-4" /> Abrir vitrine</Button>
              </Link>
            </>
          )}
          <Link href="/produtos/novo"><Button><Plus className="w-4 h-4" /> Novo produto</Button></Link>
        </div>
      </div>

      {!produtos?.length ? (
        <Card><CardBody className="text-center py-12">
          <Package className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">Nenhum produto cadastrado.</p>
        </CardBody></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {produtos.map(p => {
            const ativos = Object.entries(p.modulos ?? {}).filter(([, v]) => v).map(([k]) => MODULOS_META[k] ?? k);
            const beneficios = Array.isArray(p.beneficios) ? p.beneficios.filter(Boolean) : [];
            return (
              <Link key={p.id} href={`/produtos/${p.id}`}>
                <Card className="hover:shadow-md transition h-full overflow-hidden">
                  <CardBody>
                    <div className="flex items-start gap-4">
                      {p.imagem_url ? (
                        <img src={p.imagem_url} alt="" className="h-20 w-20 rounded-lg border border-slate-200 bg-slate-50 object-cover" />
                      ) : (
                        <div className="grid h-20 w-20 shrink-0 place-items-center rounded-lg border border-slate-200 bg-slate-50">
                          <Package className="h-7 w-7 text-slate-300" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-slate-800">{p.nome}</h3>
                          {p.destaque_comercial && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Destaque</span>}
                          {p.padrao && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Padrao</span>}
                          {!p.ativo && <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">Inativo</span>}
                        </div>
                        {p.descricao && <p className="text-sm text-slate-500 mt-1 line-clamp-2">{p.descricao}</p>}
                      </div>
                      {p.preco != null && (
                        <div className="text-right">
                          <div className="text-xs text-slate-500">Preco</div>
                          <div className="font-semibold">R$ {Number(p.preco).toFixed(2)}</div>
                        </div>
                      )}
                    </div>
                    {beneficios.length > 0 && (
                      <div className="mt-3 text-xs text-slate-500">
                        {beneficios.slice(0, 2).join(' | ')}
                      </div>
                    )}
                    <div className="mt-3 flex flex-wrap gap-1">
                      {ativos.map(m => (
                        <span key={m} className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded">
                          <Check className="inline w-3 h-3 mr-0.5" />{m}
                        </span>
                      ))}
                    </div>
                    {p.duracao_minutos && <div className="mt-2 text-xs text-slate-500">Duracao: {p.duracao_minutos} min</div>}
                  </CardBody>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
