import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

function read(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

const migration = read('supabase/migrations/20261005043000_catalogo_cards_compactos.sql');
const card = read('src/components/CatalogoProdutoCard.tsx');
const form = read('src/components/forms/CatalogoProdutosPanel.tsx');
const checkout = read('src/app/api/catalogo/agendamentos/route.ts');
const page = read('src/app/catalogo/[clinicaId]/page.tsx');

for (const field of ['preco_sob_consulta', 'imagem_posicao_x', 'imagem_posicao_y']) {
  assert.ok(migration.includes(field), `Migration sem ${field}`);
  assert.ok(form.includes(field), `Formulario sem ${field}`);
  assert.ok(page.includes(field), `Consulta publica sem ${field}`);
}

assert.match(card, /<details[\s\S]*<summary[\s\S]*Saiba mais/);
assert.ok(card.includes('md:max-h-[28rem]'), 'Detalhes sem limite de altura em telas maiores');
assert.ok(card.includes('h-[27rem]') && card.includes('has-[details[open]]:h-auto'), 'Cards fechados sem altura uniforme');
assert.ok(card.includes('hover:-translate-y-1') && card.includes('motion-reduce:transform-none'), 'Card sem elevacao acessivel');
assert.ok(card.includes('objectPosition'), 'Card sem enquadramento configuravel');
assert.ok(card.includes("const preco = sobConsulta ? 'Sob consulta'"), 'Card sem preco sob consulta');
assert.ok(card.includes('Consultar'), 'Card sob consulta sem acao de contato');
assert.ok(checkout.includes('produto.preco_sob_consulta'), 'Checkout nao bloqueia produto sob consulta');
assert.ok(form.includes('type="range"'), 'Formulario sem controles de enquadramento');
assert.ok(migration.includes('between 0 and 100'), 'Migration sem limite do enquadramento');

console.log('Catalog storefront tests passed.');
