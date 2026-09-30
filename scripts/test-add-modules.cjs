const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
let row, user, writes, conflict, deny, failure;
const client = {
  auth: { getUser: async () => ({ data: { user } }) },
  from(table) {
    assert.equal(table, 'avaliacoes');
    let payload;
    const filters = {};
    return {
      select() { return this; },
      update(value) { payload = value; return this; },
      eq(key, value) { filters[key] = value; return this; },
      is(key, value) { filters[key] = value; return this; },
      async maybeSingle() {
        if (!payload) return { data: row ? structuredClone(row) : null };
        assert.equal(filters.status, 'em_andamento');
        assert.deepEqual(Object.keys(payload), ['modulos_selecionados']);
        if (failure) return { error: { message: 'database failure' } };
        if (deny) return { data: null };
        if (conflict) { conflict = false; row.modulos_selecionados.termografia = true; return { data: null }; }
        assert.equal(filters.modulos_selecionados, row.modulos_selecionados == null ? null : JSON.stringify(row.modulos_selecionados));
        writes++;
        row.modulos_selecionados = payload.modulos_selecionados;
        return { data: { id: row.id } };
      },
    };
  },
};
const originalLoad = Module._load;
Module._load = function (request, ...args) {
  if (request === '@/lib/supabase/server') return { createClient: async () => client };
  return originalLoad.call(this, request.startsWith('@/') ? path.resolve('src', request.slice(2)) : request, ...args);
};
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
}).outputText, filename);
const { POST } = require('../src/app/api/avaliacoes/[id]/modulos/route.ts');
const { buildSteps, ETAPAS_AVALIACAO } = require('../src/lib/steps.ts');
function reset() {
  row = { id: 'test', status: 'em_andamento', modulos_selecionados: { anamnese: true, forca: false } };
  user = { id: 'authorized' }; writes = 0; conflict = deny = failure = false;
}
async function send(body = { modulos: ['jump_test'] }) {
  return POST({ json: async () => body }, { params: Promise.resolve({ id: 'test' }) });
}
async function main() {
  reset(); user = null; assert.equal((await send()).status, 401); assert.equal(writes, 0);
  for (const body of [null, {}, { modulos: [] }, { modulos: ['unknown'] }, { modulos: ['__proto__'] }, { modulos: ['forca'], status: 'em_andamento' }]) {
    reset(); assert.equal((await send(body)).status, 400); assert.equal(writes, 0);
  }
  reset(); row = null; assert.equal((await send()).status, 404);
  for (const status of ['finalizada', 'arquivada']) { reset(); row.status = status; assert.equal((await send()).status, 409); assert.equal(writes, 0); }
  reset(); assert.equal((await send()).status, 200);
  assert.deepEqual(row.modulos_selecionados, { anamnese: true, forca: false, jump_test: true });
  assert(buildSteps('test', row.modulos_selecionados).find(s => s.key === 'jump-test').enabled);
  assert.equal((await send()).status, 200); assert.equal(writes, 1);
  reset(); conflict = true; assert.equal((await send()).status, 200); assert.equal(row.modulos_selecionados.termografia, true);
  reset(); deny = true; assert.equal((await send()).status, 409); assert.equal(writes, 0);
  reset(); failure = true; assert.equal((await send()).status, 500);
  reset(); row.modulos_selecionados = null; assert.equal((await send()).status, 200);
  for (const etapa of ETAPAS_AVALIACAO.filter(e => e.mod)) {
    reset(); assert.equal((await send({ modulos: [etapa.mod] })).status, 200);
    assert.equal(row.modulos_selecionados[etapa.mod], true);
  }
  console.log('Add modules OK: authentication, RLS-visible access, state, validation, preservation, idempotency, concurrency, errors and all module routes. Mocked database; no patient records changed.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
