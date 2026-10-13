import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { hasCompleteModuleAnalysisContent, hasUsableAnalysisContent } from '../src/lib/ai/analysis-content';

assert.equal(hasUsableAnalysisContent({}), false, 'objeto vazio nao pode ser tratado como analise gerada');
assert.equal(hasUsableAnalysisContent({
  interpretacao: '   ',
  achados: [],
  recomendacoes: [],
  versao_paciente: '',
}), false, 'campos obrigatorios vazios nao podem ser persistidos');
assert.equal(hasUsableAnalysisContent({ modelo: 'claude', gerado_em: '2026-10-12' }), false, 'metadados isolados nao formam uma analise');

assert.equal(hasUsableAnalysisContent({
  interpretacao: 'A capacidade cardiorrespiratoria encontra-se acima do esperado para o perfil avaliado.',
  achados: [],
  recomendacoes: [],
  versao_paciente: '',
}), true, 'uma interpretacao clinica substantiva deve ser aceita');
assert.equal(hasUsableAnalysisContent({
  achados: ['O VO2max estimado ficou acima da media populacional comparavel.'],
}), true, 'achados substantivos devem ser aceitos');
assert.equal(hasUsableAnalysisContent({
  versao_paciente: 'Seu resultado mostra boa capacidade aerobica para a sua faixa de comparacao.',
}), true, 'a versao para o paciente deve ser aceita');
assert.equal(hasCompleteModuleAnalysisContent({}), false, 'objeto vazio nao e uma analise completa');
assert.equal(hasCompleteModuleAnalysisContent({
  interpretacao: 'Capacidade aerobica acima do esperado para o perfil avaliado.',
  achados: ['O resultado indica boa tolerancia ao esforco progressivo.'],
  recomendacoes: [],
  versao_paciente: 'Seu desempenho cardiorrespiratorio foi favoravel nesta avaliacao.',
}), false, 'analise sem recomendacao nao deve substituir a versao anterior');
assert.equal(hasCompleteModuleAnalysisContent({
  interpretacao: 'Capacidade aerobica acima do esperado para o perfil avaliado.',
  achados: ['O resultado indica boa tolerancia ao esforco progressivo.'],
  recomendacoes: ['Manter treinamento individualizado e acompanhar a evolucao.'],
  versao_paciente: 'Seu desempenho cardiorrespiratorio foi favoravel nesta avaliacao.',
}), true, 'analise completa deve ser aceita');

const clientSource = readFileSync(new URL('../src/lib/ai/client.ts', import.meta.url), 'utf8');
assert.match(
  clientSource,
  /required:\s*\['interpretacao', 'achados', 'recomendacoes', 'versao_paciente'\]/,
  'o contrato estruturado do Claude deve exigir os campos essenciais',
);

const serviceSource = readFileSync(new URL('../src/lib/ai/service.ts', import.meta.url), 'utf8');
const validationIndex = serviceSource.lastIndexOf('if (!hasCompleteModuleAnalysisContent(conteudo))');
const persistenceIndex = serviceSource.indexOf('await persistir(avaliacaoId, modulo, conteudo, resp.modelo)');
assert.ok(validationIndex >= 0, 'o servico deve validar o conteudo retornado pela IA');
assert.ok(persistenceIndex > validationIndex, 'a resposta vazia deve ser rejeitada antes da persistencia');
assert.match(serviceSource, /resposta anterior foi incompleta/i, 'o servico deve repetir uma geracao incompleta automaticamente');

console.log('IA: respostas vazias rejeitadas e conteudo clinico valido reconhecido.');
