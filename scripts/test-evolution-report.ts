import { renderEvolutionReportHTML } from '../src/lib/pdf/evolution-template';

const image = 'data:image/svg+xml;base64,' + Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="480"><rect width="100%" height="100%" fill="#e2e8f0"/><circle cx="160" cy="120" r="45" fill="#94a3b8"/><rect x="105" y="175" width="110" height="220" rx="45" fill="#64748b"/></svg>',
).toString('base64');

const base = {
  status: 'finalizada',
  tipo: 'Avaliação completa',
  antropometria: { altura: 175 },
  forca: {},
  flexibilidade: {},
  cardiorrespiratorio: {},
  posturografia: {
    foto_anterior: image,
    foto_posterior: image,
    foto_lateral_dir: image,
    foto_lateral_esq: image,
  },
  bioimpedancia: {},
  rml: {},
};

const html = renderEvolutionReportHTML({
  clinica: { nome: 'MedFit', cor_primaria: '#059669' },
  paciente: { nome: 'Paciente Teste', sexo: 'M', idade: 36 },
  avaliador: { nome: 'Profissional Teste', conselho: 'CREF 000000-G/SP' },
  avaliacoes: [
    {
      ...base,
      id: 'anterior',
      data: '2026-01-10',
      scores: { global: 61, postura: 60, composicao_corporal: 55, forca: 62, flexibilidade: 58, rml: 60, cardiorrespiratorio: 65 },
      antropometria: { ...base.antropometria, peso: 92, massa_magra: 67 },
      bioimpedancia: { percentual_gordura: 27.2 },
      cardiorrespiratorio: { vo2max: 34.5 },
    },
    {
      ...base,
      id: 'atual',
      data: '2026-06-10',
      scores: { global: 76, postura: 72, composicao_corporal: 70, forca: 78, flexibilidade: 71, rml: 74, cardiorrespiratorio: 80 },
      antropometria: { ...base.antropometria, peso: 86, massa_magra: 69 },
      bioimpedancia: { percentual_gordura: 21.4 },
      cardiorrespiratorio: { vo2max: 41.2 },
    },
  ],
  analiseEvolucao: { texto_editado: 'Evolução positiva, com melhora global da composição corporal e das capacidades físicas.' },
});

const checks = [
  'Evolução fisiometabólica',
  'Comparativo principal',
  'Evolução dos scores',
  'Linha do tempo',
  'Comparativo postural',
  'Lateral direita',
  'Lateral esquerda',
  'Paciente Teste',
  '+15',
  'Evolução positiva',
];

for (const check of checks) {
  if (!html.includes(check)) throw new Error(`Relatório de evolução sem "${check}"`);
}

if ((html.match(/<section class="page/g) ?? []).length < 4) {
  throw new Error('Relatório de evolução deveria gerar ao menos quatro páginas no cenário completo');
}

if ((html.match(/class="photo"/g) ?? []).length !== 8) {
  throw new Error('Comparativo postural deve apresentar oito posições de fotografia');
}

console.log(JSON.stringify({ ok: true, bytes: Buffer.byteLength(html), checks: checks.length }, null, 2));
