import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  cpfValido,
  hashConteudo,
  hashEvidencia,
  normalizarCpf,
} from '../src/lib/consentimento/evidencia-avulsa';

const migrationPath = path.join(
  process.cwd(),
  'supabase',
  'migrations',
  '20261005021118_comprovantes_tcle_avulsos.sql',
);
const migration = fs.readFileSync(migrationPath, 'utf8');

assert.equal(normalizarCpf('529.982.247-25'), '52998224725');
assert.equal(cpfValido('529.982.247-25'), true);
assert.equal(cpfValido('111.111.111-11'), false);
assert.equal(cpfValido('529.982.247-24'), false);

const modelo = {
  nome: 'TCLE de teste',
  tipo: 'tcle',
  versao: 2,
  texto: 'Conteudo integral',
  texto_html: '<p>Conteudo integral</p>',
};
assert.equal(hashConteudo(modelo), hashConteudo({ ...modelo }));
assert.notEqual(hashConteudo(modelo), hashConteudo({ ...modelo, texto: 'Conteudo alterado' }));
assert.notEqual(
  hashEvidencia({ documento: 'a', aceito_em: '2026-10-04T10:00:00Z' }),
  hashEvidencia({ documento: 'a', aceito_em: '2026-10-04T10:00:01Z' }),
);

for (const trecho of [
  'create table if not exists public.documentos_pre_teste_aceites',
  'alter table public.documentos_pre_teste_aceites enable row level security',
  "'consentimento-comprovantes'",
  "nivel_evidencia in ('completo', 'parcial_legado')",
  'on delete restrict',
  'on conflict (documento_id) do nothing',
]) {
  assert.ok(migration.toLowerCase().includes(trecho.toLowerCase()), `Migration sem: ${trecho}`);
}

console.log('Consent evidence tests passed.');
