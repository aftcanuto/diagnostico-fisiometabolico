import assert from 'node:assert/strict';
import { MEASUREMENTS, calculateAnthropometry, newAnthropometry } from '../src/lib/anthropometry';
import { anthropometryAIData, anthropometryAnalysisUsable } from '../src/lib/anthropometry-record';
import { promptAntropometria, ANTHROPOMETRY_AI_RULES } from '../src/lib/ai/prompts';

const input = newAnthropometry();
for (const measurement of MEASUREMENTS) {
  const value = measurement.id === 'mass' ? 75 : measurement.id === 'height' ? 175 : measurement.group === 'skinfold' ? 12 : measurement.group === 'breadth' ? 7 : 35;
  input.measurements[measurement.id].readings = [value, value, null];
}
input.methods = ['indices', 'martin1990', 'martinBone1991', 'phantom'];
const results = calculateAnthropometry(input, { date:'2026-09-28', birthDate:'1990-01-01', sex:'M' });
const row = { registro_v2:input, resultados_v2:results, revision_v2:3 };
const safe = anthropometryAIData(row) as any;
assert.equal(safe.resultados.results.every((item:any) => typeof item.value === 'number' && Number.isFinite(item.value)), true);
assert.ok(safe.resultados.results.find((item:any) => item.id === 'martin1990').value > 0, 'resultado numerico em revisao deve chegar como estimativa utilizavel');
assert.equal(safe.resultados.results.find((item:any) => item.id === 'martin1990')?.quality, 'calculado_com_ressalva');
assert.equal(safe.resultados.results.find((item:any) => item.id === 'bmi')?.quality, 'calculado');
assert.equal(JSON.stringify(safe).includes('Completar primeira e segunda leituras em rodadas'), false, 'alertas repetitivos de coleta nao devem dominar o contexto da IA');
const prompt = promptAntropometria({ nome:'Paciente teste', sexo:'M', idade:36 }, row);
assert.match(prompt.system, /nao diagnostica risco/i);
assert.match(prompt.system, /nao abra a analise com pendencias/i);
assert.match(prompt.user, /reduzir a certeza, nao impedir a analise/i);
assert.doesNotMatch(prompt.user, /potencial genetico|limite natural/i);
assert.match(prompt.user, /MARTIN_1990/);
assert.match(ANTHROPOMETRY_AI_RULES, /nao combine equacoes/i);
const legacyPrompt = promptAntropometria({ nome:'Paciente historico', sexo:'M', idade:36 }, { peso:75, estatura:175, massa_magra:62, massa_ossea:9 });
assert.doesNotMatch(legacyPrompt.user, /potencial gen[eé]tico|limite natural|berkhan|massa [oó]ssea ideal/i);
assert.match(legacyPrompt.user, /FFMI apenas como índice descritivo/i);
assert.equal(anthropometryAnalysisUsable({ tipo:'antropometria', conteudo:{ _anthropometry_revision:3 } }, row), true);
assert.equal(anthropometryAnalysisUsable({ tipo:'conclusao_global', conteudo:{ _anthropometry_revision:2 } }, row), false);
assert.equal(anthropometryAnalysisUsable({ tipo:'jump_test', conteudo:{} }, row), true);
console.log('Antropometria IA: resultados calculados com ressalva preservados, prompt interpretativo, referencias e invalidacao por revisao aprovados.');
