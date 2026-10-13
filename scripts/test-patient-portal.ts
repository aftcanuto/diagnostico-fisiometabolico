import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { completeAnthropometry, completeJumpTest, completeThermography } from './fixtures/complete-modules';

async function main() {
  (globalThis as any).React = React;
  const { PortalPaciente } = await import('../src/components/PortalPaciente');

const moduleTypes = [
  'sinais_vitais', 'bioimpedancia', 'posturografia', 'termografia', 'antropometria',
  'jump_test', 'flexibilidade', 'forca', 'rml', 'cardiorrespiratorio', 'biomecanica_corrida',
] as const;
const analyses = Object.fromEntries(moduleTypes.map(tipo => [tipo, `Analise clinica completa do modulo ${tipo}, com interpretacao clara para o paciente.`]));
analyses.conclusao_global = 'Conclusao global integrada da saude funcional e fisiometabolica do paciente.';

const evaluation:any = {
  id:'portal-audit', data:'2026-10-12', tipo:'Avaliacao completa', status:'finalizada',
  modulos_selecionados:Object.fromEntries(moduleTypes.map(tipo => [tipo, true])),
  scores:{global:85,postura:82,composicao_corporal:84,forca:90,flexibilidade:70,rml:88,cardiorrespiratorio:86},
  sinais_vitais:{pa_sistolica:118,pa_diastolica:76,fc_repouso:62,spo2:98},
  bioimpedancia:{peso_kg:68.4,agua_corporal_kg:35.4,gordura_visceral_nivel:7,idade_metabolica:32,massa_muscular_kg:27.4},
  antropometria:completeAnthropometry(),
  jump_test:completeJumpTest(),
  termografia:completeThermography(),
  flexibilidade:{melhor_resultado:31,classificacao:'Bom',tentativa_1:29,tentativa_2:31,tentativa_3:30},
  forca:{preensao_dir_kgf:32,preensao_esq_kgf:30,assimetria_percent:6.2},
  rml:{categoria:'jovem_ativo',mmss_reps:22,mmss_classificacao:'Bom',abd_1min_reps:34,abd_1min_classificacao:'Bom',abd_prancha_seg:78,abd_prancha_classificacao:'Regular',mmii_agach_reps:42,mmii_agach_classificacao:'Bom'},
  cardiorrespiratorio:{vo2max:42.5,classificacao_vo2:'Bom',fc_max:184,rec_fc:{10:2,30:4,60:-6}},
  posturografia:{alinhamentos:{ombro_direito_elevado:true}},
  biomecanica_corrida:{angulos:{tronco:{valor:12,ideal_min:4,ideal_max:10,classificacao:'atencao'}}},
  analises_ia:analyses,
};

const html = renderToStaticMarkup(React.createElement(PortalPaciente, {
  paciente:{nome:'Paciente Teste',sexo:'M',data_nascimento:'1980-01-01'},
  avaliacoes:[evaluation],
}));
const source = readFileSync(new URL('../src/components/PortalPaciente.tsx', import.meta.url), 'utf8');

assert.doesNotMatch(source, /function ModuleScoreBadge/, 'portal nao deve ter card de score por modulo');
assert.match(html, /Resultado global/);
for (const tipo of moduleTypes) assert.match(html, new RegExp(`Analise clinica completa do modulo ${tipo}`), `analise ausente no portal: ${tipo}`);
assert.equal((html.match(/data-patient-module-analysis="true"/g) ?? []).length, moduleTypes.length + 1, 'cada modulo e a conclusao devem ter um unico bloco de analise');
assert.ok(html.indexOf('Conclusão clínica') < html.indexOf('Referências'), 'conclusao global deve vir antes das referencias');
for (const technicalText of ['Entradas utilizadas', 'Calculado com ressalva', 'Motor anthropometry', 'catalogo strict', 'Idade metabólica']) {
  assert.equal(html.includes(technicalText), false, `conteudo tecnico indevido no portal: ${technicalText}`);
}
assert.match(html, /Resumo da composicao corporal/);
assert.match(html, /Somatocarta Heath-Carter/);

console.log('Portal do paciente: scores apenas no resumo, analises por modulo, conclusao antes das referencias e antropometria simplificada aprovados.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
