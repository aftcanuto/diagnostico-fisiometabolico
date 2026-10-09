const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
process.env.NEXT_PUBLIC_SUPABASE_URL ||= 'https://preview.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||= 'preview-anon-key';
const resolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...args) {
  return resolve.call(this, request.startsWith('@/') ? path.resolve('src', request.slice(2)) : request, ...args);
};
function load(module, filename) {
  module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    fileName: filename,
  }).outputText, filename);
}
require.extensions['.ts'] = load;
require.extensions['.tsx'] = load;
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const R = require('../src/lib/clinical/references.ts');
const A = require('../src/lib/anthropometry/catalog.ts');
const N = require('../src/lib/nutrition/planoAlimentar.ts');
const P = require('../src/lib/ai/prompts.ts');
const F = require('../src/lib/clinical/formulas.ts');
const { PortalPaciente } = require('../src/components/PortalPaciente.tsx');
const { renderLaudoHTML } = require('../src/lib/pdf/template.ts');
const { renderEvolutionReportHTML } = require('../src/lib/pdf/evolution-template.ts');
const { newJumpData } = require('../src/lib/jump-test.ts');
const paciente = { nome: 'Teste bibliografia', sexo: 'M', idade: 35, data_nascimento: '1991-01-01' };
const ids = html => [...html.matchAll(/data-reference-id="([^"]+)"/g)].map(m => m[1]);
const keys = Object.keys(R.MODULOS_REFERENCIAS);
assert.equal(new Set(R.REFERENCIAS.map(r => r.id)).size, R.REFERENCIAS.length);
assert.equal(new Set(R.REFERENCIAS.map(r => r.url)).size, R.REFERENCIAS.length);
assert.equal(new Set(F.FORMULAS_CLINICAS.map(f => f.id)).size, F.FORMULAS_CLINICAS.length);
assert(F.FORMULAS_CLINICAS.some(f => f.tipo === 'indice_operacional'));
assert(P.promptConclusao(paciente, { selecionados: {} }).system.includes(F.INDICE_MEDFIT_AVISO));
const referenceIds = new Set([...R.REFERENCIAS.map(r => r.id), ...A.REFERENCES.map(r => r.id), ...N.REFERENCIAS_NUTRICIONAIS.map(r => r.id)]);
for (const formula of F.FORMULAS_CLINICAS) for (const id of String(formula.referencia ?? '').split('|').filter(Boolean)) {
  assert(referenceIds.has(id), `Formula ${formula.id} aponta para referencia inexistente: ${id}`);
}
assert.deepEqual(R.referenciasAvaliacao({ anamnese: true }), []);
assert.equal(R.referenciasModulo('anamnese'), '');
assert.deepEqual(R.modulosDaAvaliacao({ modulos_selecionados: {}, jump_test: {} }), {});
assert.equal(R.modulosDaAvaliacao({ jump_test: {} }).jump_test, true);
const builders = {
  sinais_vitais: P.promptSinaisVitais, posturografia: P.promptPosturografia,
  termografia: P.promptTermografia, jump_test: P.promptJumpTest,
  bioimpedancia: P.promptBioimpedancia, antropometria: P.promptAntropometria,
  flexibilidade: P.promptFlexibilidade, forca: P.promptForca,
  rml: P.promptRML, cardiorrespiratorio: P.promptCardio, biomecanica_corrida: P.promptBiomecanica,
};
for (const key of [...keys, 'anamnese', 'all', 'none']) {
  const selected = key === 'all' ? Object.fromEntries(keys.map(k => [k, true])) : key === 'none' ? {} : { [key]: true };
  const refs = R.referenciasAvaliacao(selected);
  if (keys.includes(key)) assert(refs.length > 0, `Missing references: ${key}`);
  const avaliacao = { id: 'fixture', data: '2026-09-24', tipo: 'personalizado', status: 'finalizada', modulos_selecionados: selected, scores: {} };
  const report = renderLaudoHTML({ paciente, avaliador: { nome: 'Teste' }, avaliacao, modulos: selected, dados: {}, scores: {}, pdfConfig: { referencias: [{ id: 'legacy', texto: 'LEGACY_REFERENCE_MUST_NOT_OVERRIDE' }] } });
  const portal = renderToStaticMarkup(React.createElement(PortalPaciente, { paciente, avaliacoes: [avaliacao] }));
  const history = [{ ...avaliacao, id: 'previous', data: '2026-08-24' }, avaliacao];
  const evolution = renderEvolutionReportHTML({ paciente, avaliacoes: history });
  const expected = refs.map(r => r.id);
  assert.deepEqual(ids(report), expected, `PDF: ${key}`);
  assert.deepEqual(ids(portal), expected, `Portal: ${key}`);
  assert.deepEqual(ids(evolution), expected, `Evolution PDF: ${key}`);
  assert(!report.includes('LEGACY_REFERENCE_MUST_NOT_OVERRIDE'));
  const conclusion = P.promptConclusao(paciente, { selecionados: selected });
  const longitudinal = P.promptEvolucao(paciente, history);
  for (const ref of R.REFERENCIAS) {
    assert.equal(conclusion.user.includes(ref.url), expected.includes(ref.id), `Global IA: ${key}/${ref.id}`);
    assert.equal(longitudinal.system.includes(ref.url), expected.includes(ref.id), `Evolution IA: ${key}/${ref.id}`);
  }
  if (keys.includes(key)) {
    assert.equal(typeof builders[key], 'function', `Builder: ${key}`);
    const prompt = builders[key](paciente, key === 'jump_test' ? newJumpData() : {});
    for (const ref of refs) assert((prompt.system + prompt.user).includes(R.textoReferencia(ref)), `Module IA: ${key}/${ref.id}`);
  }
  if (key === 'all') {
    fs.mkdirSync('tmp/references', { recursive: true });
    fs.writeFileSync('tmp/references/all-modules.html', report);
    fs.writeFileSync('tmp/references/evolution.html', evolution);
    fs.writeFileSync('tmp/references/portal.html', `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{box-sizing:border-box}body{margin:0;font-family:Arial}</style></head><body>${portal}</body></html>`);
  }
}
const disabled = { jump_test: false, termografia: true };
const historicalSelection = R.modulosDoHistorico([
  { modulos_selecionados: { forca: true, jump_test: false }, jump_test: newJumpData() },
  { modulos_selecionados: { termografia: true } },
]);
assert.equal(historicalSelection.forca, true);
assert.equal(historicalSelection.termografia, true);
assert.equal(historicalSelection.jump_test, false);
assert(!R.referenciasAvaliacao(disabled).some(r => r.modulos.includes('jump_test')));
assert.equal(R.referenciasAvaliacao({ forca: true, rml: true, cardiorrespiratorio: true }).filter(r => r.id === 'acsm-12').length, 1);
console.log(`References OK: ${keys.length} modules, no anamnesis bibliography, portal/PDF/module IA/global IA/evolution parity, deduplication and legacy override protection.`);
