const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
let row, user, evaluation, writes, conflict, failure;
const client = {
  auth: { getUser: async () => ({ data: { user } }) },
  from(table) {
    let payload;
    const filters = {};
    return {
      select() { return this; },
      update(value) { payload = value; return this; },
      insert(value) { payload = value; return this; },
      eq(key, value) { filters[key] = value; return this; },
      is(key, value) { filters[key] = value; return this; },
      async maybeSingle() {
        if (table === 'avaliacoes') return { data: evaluation };
        if (table === 'avaliadores') return { data: { nome: 'Profissional teste', qualificacao_isak: { status: 'pending', level: 1 } } };
        assert.equal(table, 'antropometria');
        if (!payload) return { data: structuredClone(row) };
        if (failure) return { error: { code: '42501' } };
        if (conflict) return { data: null };
        if (row) assert.equal(filters.revision_v2, row.revision_v2 ?? null);
        assert.equal(payload.avaliacao_id, 'test');
        assert.equal(payload.registro_v2.version, 2);
        assert.equal(payload.resultados_v2.version, 2);
        writes++;
        row = payload;
        return { data: row };
      },
    };
  },
};
const originalLoad = Module._load;
Module._load = function(request, ...args) {
  if (request === '@/lib/supabase/server') return { createClient: async () => client };
  return originalLoad.call(this, request.startsWith('@/') ? path.resolve('src', request.slice(2)) : request, ...args);
};
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
}).outputText, filename);
const { saveAnthropometryV2 } = require('../src/lib/api/save-anthropometry.ts');
const { newAnthropometry } = require('../src/lib/anthropometry');
function reset() {
  row = null; user = { id: 'test-user' }; writes = 0; conflict = failure = false;
  evaluation = { id: 'test', data: '2026-09-28', status: 'em_andamento', pacientes: { data_nascimento: '1990-01-01', sexo: 'M' } };
}
const send = (extra = {}) => saveAnthropometryV2('test', { registro_v2: newAnthropometry(), expected_revision: null, ...extra });
async function main() {
  reset(); user = null; assert.equal((await send()).status, 401); assert.equal(writes, 0);
  reset(); evaluation = null; assert.equal((await send()).status, 403);
  reset(); evaluation.status = 'finalizada'; assert.equal((await send()).status, 409);
  reset(); row = { peso: 80 }; assert.equal((await send()).status, 409); assert.equal(row.peso, 80);
  reset(); row = { dobras: { triceps: { m1: null, m2: null, m3: null, media: null } }, circunferencias: {}, diametros: {} };
  assert.equal((await send()).status, 200); assert.equal(row.registro_v2.version, 2); assert.equal(row.revision_v2, 1);
  reset(); assert.equal((await send({ expected_revision: undefined })).status, 400);
  reset();
  const partial = newAnthropometry();
  partial.measurements.mass.readings = [84, null, null];
  assert.equal((await saveAnthropometryV2('test', { registro_v2: partial, expected_revision: null })).status, 200);
  assert.equal(row.revision_v2, 1);
  assert.deepEqual(row.registro_v2.measurements.mass.readings, [84, null, null]);
  assert.equal(row.resultados_v2.measurements.mass.consolidation, 'single');
  assert.equal(row.resultados_v2.measurements.height.status, 'missing');
  assert.equal('rcq' in row, false);
  assert.equal('observacoes' in row, false);
  assert.equal(row.resultados_v2.professional.qualification.status, 'pending');
  assert.equal((await send()).status, 409);
  assert.equal((await send({ expected_revision: 1 })).status, 200); assert.equal(row.revision_v2, 2);
  conflict = true; assert.equal((await send({ expected_revision: 2 })).status, 409);
  reset(); failure = true; assert.equal((await send()).status, 500);
  console.log('Antropometria API: autenticacao, legado, rascunho, revisoes, conflitos, erros e snapshot profissional aprovados. Banco simulado.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
