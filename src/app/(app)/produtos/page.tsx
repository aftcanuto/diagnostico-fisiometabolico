import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus, Package, Check } from 'lucide-react';

const MODULOS_META: Record<string, string> = {
  anamnese: 'Anamnese',
  sinais_vitais: 'Sinais vitais',
  posturografia: 'Posturografia',
  bioimpedancia: 'Bioimpedância',
  antropometria: 'Antropometria',
  flexibilidade: 'Flexibilidade',
  forca: 'Força',
  rml: 'RML',
  cardiorrespiratorio: 'Cardio',
  biomecanica_corrida: 'Biomecânica da corrida',
};

export default async function ProdutosPage() {
  const supabase = createClient();
  const { data: produtos } = await supabase.from('produtos')
    .select('*').order('padrao', { ascending: false }).order('nome');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Produtos</h1>
          <p className="text-sm text-slate-500">Pacotes de diagnóstico oferecidos pela sua clínica</p>
        </div>
        <Link href="/produtos/novo"><Button><Plus className="w-4 h-4" /> Novo produto</Button></Link>
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
            return (
              <Link key={p.id} href={`/produtos/${p.id}`}>
                <Card className="hover:shadow-md transition h-full">
                  <CardBody>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-slate-800">{p.nome}</h3>
                          {p.padrao && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Padrão</span>}
                          {!p.ativo && <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">Inativo</span>}
                        </div>
                        {p.descricao && <p className="text-sm text-slate-500 mt-1">{p.descricao}</p>}
                      </div>
                      {p.preco != null && (
                        <div className="text-right">
                          <div className="text-xs text-slate-500">Preço</div>
                          <div className="font-semibold">R$ {Number(p.preco).toFixed(2)}</div>
                        </div>
                      )}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {ativos.map(m => (
                        <span key={m} className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded">
                          <Check className="inline w-3 h-3 mr-0.5" />{m}
                        </span>
                      ))}
                    </div>
                    {p.duracao_minutos && <div className="mt-2 text-xs text-slate-500">Duração: {p.duracao_minutos} min</div>}
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
