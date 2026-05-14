const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

const root = process.cwd();
process.env.NEXT_PUBLIC_SUPABASE_URL ||= 'https://preview.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||= 'preview-anon-key';

const originalResolve = Module._resolveFilename;
Module._resolveFilename = function resolveAlias(request, parent, isMain, options) {
  if (request.startsWith('@/')) {
    return originalResolve.call(this, path.join(root, 'src', request.slice(2)), parent, isMain, options);
  }
  return originalResolve.call(this, request, parent, isMain, options);
};

function loadTs(module, filename) {
  const source = fs.readFileSync(filename, 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
    },
    fileName: filename,
  });
  module._compile(outputText, filename);
}

require.extensions['.ts'] = loadTs;
require.extensions['.tsx'] = loadTs;

const { dados: dadosLaudo } = require('./preview-laudo.ts');
require('./preview-dashboard-cliente.tsx');
require('./preview-dashboard-clinico.tsx');
const { renderLaudoHTML } = require('../src/lib/pdf/template.ts');
const P = require('../src/lib/ai/prompts.ts');
const { parseJSON } = require('../src/lib/ai/client.ts');

const tipos = [
  'anamnese',
  'sinais_vitais',
  'posturografia',
  'bioimpedancia',
  'antropometria',
  'flexibilidade',
  'forca',
  'rml',
  'cardiorrespiratorio',
  'biomecanica_corrida',
  'conclusao_global',
  'evolucao',
];

const nomesRelatorio = {
  anamnese: 'Anamnese',
  sinais_vitais: 'Sinais Vitais',
  posturografia: 'Posturografia',
  bioimpedancia: 'Bioimpedância',
  antropometria: 'Antropometria',
  flexibilidade: 'Flexibilidade',
  forca: 'Força',
  rml: 'Resistência Muscular',
  cardiorrespiratorio: 'Cardiorrespiratório',
  biomecanica_corrida: 'Biomecânica da corrida',
  conclusao_global: 'Conclusão clínica',
  evolucao: 'Evolução longitudinal',
};

const ctx = {
  nome: dadosLaudo.paciente.nome,
  sexo: dadosLaudo.paciente.sexo,
  idade: dadosLaudo.paciente.idade,
  objetivo: 'redução de gordura, corrida recreativa e prevenção de dor',
  historicoResumido: 'desconforto lombar leve e histórico esportivo recreacional',
};

const iaMock = tipo => ({
  achados: [`Achado simulado para ${tipo}`],
  interpretacao: `Interpretação simulada validando o módulo ${tipo}.`,
  riscos: [`Risco monitorável em ${tipo}`],
  beneficios: [`Benefício esperado ao corrigir ${tipo}`],
  recomendacoes: [`Recomendação objetiva para ${tipo}`],
  alertas: [],
});

const analisesIA = Object.fromEntries(
  tipos.map(tipo => [tipo, tipo === 'conclusao_global'
    ? {
        resumo_executivo: 'Conclusão global simulada para teste completo.',
        pontos_fortes: ['Boa aderência geral'],
        pontos_criticos: ['Monitorar assimetrias e composição corporal'],
        prioridades: [{ titulo: 'Prioridade simulada', acao: 'Manter acompanhamento', prazo: '6 semanas' }],
        mensagem_paciente: 'Mensagem simulada ao paciente.',
      }
    : tipo === 'evolucao'
      ? {
          tendencias: ['Tendência simulada de melhora global'],
          progressos: ['Progressão simulada de força'],
          regressoes: ['Sem regressões críticas simuladas'],
          alertas: [],
          interpretacao: 'Evolução longitudinal simulada.',
          proximos_passos: ['Reavaliar em 6 a 8 semanas'],
        }
      : iaMock(tipo)
  ])
);

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function checkTextFile(file, required) {
  assert(fs.existsSync(file), `Arquivo não gerado: ${file}`);
  const html = fs.readFileSync(file, 'utf8');
  assert(!html.includes('[object Object]'), `${file}: contém [object Object]`);
  assert(!/[Ã�ð]/.test(html), `${file}: contém caracteres corrompidos`);
  for (const item of required) assert(html.includes(item), `${file}: faltou "${item}"`);
  return html;
}

function testarPrompts() {
  const dados = dadosLaudo.dados;
  const tests = [
    ['anamnese', P.promptAnamnese(ctx, dados.anamnese)],
    ['sinais_vitais', P.promptSinaisVitais(ctx, dados.sinais_vitais)],
    ['posturografia', P.promptPosturografia(ctx, dados.posturografia)],
    ['bioimpedancia', P.promptBioimpedancia(ctx, dados.bioimpedancia)],
    ['antropometria', P.promptAntropometria(ctx, dados.antropometria)],
    ['flexibilidade', P.promptFlexibilidade(ctx, dados.flexibilidade)],
    ['forca', P.promptForca(ctx, dados.forca)],
    ['rml', P.promptRML(ctx, dados.rml)],
    ['cardiorrespiratorio', P.promptCardio(ctx, dados.cardiorrespiratorio)],
    ['biomecanica_corrida', P.promptBiomecanica(ctx, dados.biomecanica_corrida)],
    ['conclusao_global', P.promptConclusao(ctx, { scores: dadosLaudo.scores, analises: analisesIA })],
    ['evolucao', P.promptEvolucao(ctx, [{ data: '2026-02-20' }, { data: '2026-04-27' }])],
  ];

  for (const [tipo, prompt] of tests) {
    assert(prompt.system.length > 100, `${tipo}: system prompt muito curto`);
    assert(prompt.user.length > 100, `${tipo}: user prompt muito curto`);
    assert(/Referências|Referencias|referências|referencias/.test(prompt.user + prompt.system), `${tipo}: sem referências clínicas`);
  }
}

function testarParserIA() {
  assert(parseJSON('{"ok":true}').ok === true, 'Parser IA falhou com JSON puro');
  assert(parseJSON('```json\n{"ok":true}\n```').ok === true, 'Parser IA falhou com fence markdown');
  assert(parseJSON('Texto antes {"ok":true} texto depois').ok === true, 'Parser IA falhou ao extrair JSON embutido');
  const fallback = parseJSON('Analise textual sem JSON estruturado.');
  assert(fallback.interpretacao.includes('Analise textual'), 'Parser IA deveria converter texto livre em analise revisavel');
  assert(Array.isArray(fallback.alertas) && fallback.alertas.length > 0, 'Parser IA deveria sinalizar revisao em texto livre');
}

function assertCodigoContem(file, trechos) {
  const conteudo = fs.readFileSync(path.join(root, file), 'utf8');
  for (const trecho of trechos) {
    assert(conteudo.includes(trecho), `${file}: faltou validacao "${trecho}"`);
  }
}

function main() {
  assert((dadosLaudo.dados.posturografia?.foto_anterior ?? '').startsWith('data:image'), 'Posturografia sem foto anterior simulada');
  assert((dadosLaudo.dados.posturografia?.foto_posterior ?? '').startsWith('data:image'), 'Posturografia sem foto posterior simulada');
  assert((dadosLaudo.dados.posturografia?.foto_lateral_dir ?? '').startsWith('data:image'), 'Posturografia sem foto lateral direita simulada');
  assert((dadosLaudo.dados.posturografia?.foto_lateral_esq ?? '').startsWith('data:image'), 'Posturografia sem foto lateral esquerda simulada');
  assert((dadosLaudo.dados.forca?.sptech_testes ?? []).length >= 11, 'SPTech deveria cobrir todas as articulações simuladas');
  assert((dadosLaudo.dados.forca?.tracao_testes ?? []).length >= 7, 'Tração deveria cobrir todos os testes de referência simulados');

  testarPrompts();
  testarParserIA();

  const fullData = { ...dadosLaudo, analisesIA };
  const fullHtml = renderLaudoHTML(fullData);
  const out = path.resolve('preview-laudo-full-smoke.html');
  fs.writeFileSync(out, fullHtml, 'utf8');

  const laudo = checkTextFile('preview-laudo-full-smoke.html', [
    ...Object.values(nomesRelatorio),
    'Análise clínica',
    'Ver video',
    'Evolução longitudinal',
  ]);
  const dashboardCliente = checkTextFile('preview-dashboard-cliente.html', [
    'Seu resultado geral',
    'Anamnese',
    'Sinais vitais',
    'FFMI',
    'Bioimpedância',
    'Força muscular',
    'Biomecânica da corrida',
    'Ver vídeo',
    'Evolução dos scores',
  ]);
  const dashboardClinico = checkTextFile('preview-dashboard-clinico.html', [
    'Edição rápida da avaliação',
    'Análises clínicas',
    'Score global',
    'FFMI',
    'Biomecânica da corrida',
    'Evolução dos scores',
  ]);

  const aiBlockCount = (laudo.match(/Análise clínica/g) ?? []).length;
  assert(aiBlockCount >= 10, `Laudo deveria ter análises clínicas em todos os módulos; encontrou ${aiBlockCount}`);

  assertCodigoContem('src/app/api/anamnese-links/route.ts', [
    'templateAnamneseAtivoDaClinica',
    'Template nao encontrado, inativo ou fora da clinica',
  ]);
  assertCodigoContem('src/app/api/protocolo-envios/route.ts', [
    'recomendacoesAtivasDaClinica',
    'Ha recomendacoes invalidas, inativas ou fora da clinica',
  ]);
  assertCodigoContem('src/app/api/anamnese-publica/route.ts', [
    'link.respondido_em',
    'Esta anamnese ja foi enviada',
  ]);
  assertCodigoContem('src/app/api/consentimento-publico/route.ts', [
    'link.aceito_em',
    'Este termo ja foi aceito',
  ]);
  assertCodigoContem('src/app/api/backup/avaliacoes/route.ts', [
    'Apenas administradores podem exportar o backup',
    'text/csv; charset=utf-8',
    'backup-avaliacoes-',
  ]);
  assertCodigoContem('src/app/api/pdf/route.ts', [
    'conteudo_paciente',
    'texto_paciente_editado',
    'plano_acao',
  ]);
  assertCodigoContem('src/app/api/pdf/publico/route.ts', [
    "aval.status !== 'finalizada'",
    'conteudo_paciente',
    'texto_paciente_editado',
    'plano_acao',
    'Cache-Control',
  ]);
  assertCodigoContem('src/app/api/ia/gerar/route.ts', [
    'usuarioPodeAcessarAvaliacao',
    'TIPOS_IA',
    'IA nao habilitada para sua clinica',
  ]);
  assertCodigoContem('src/app/api/ia/editar/route.ts', [
    'usuarioPodeAcessarAvaliacao',
    'TIPOS_IA',
    'createAdminClient',
  ]);
  assertCodigoContem('src/app/p/[token]/page.tsx', [
    'conteudo_paciente',
    'texto_paciente_editado',
    'plano_acao',
  ]);

  console.log(JSON.stringify({
    ok: true,
    prompts: tipos.length,
    laudoBytes: laudo.length,
    dashboardClienteBytes: dashboardCliente.length,
    dashboardClinicoBytes: dashboardClinico.length,
    analisesNoLaudo: aiBlockCount,
    arquivoLaudoCompleto: out,
  }, null, 2));
}

main();
