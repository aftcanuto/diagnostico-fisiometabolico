// Reviewed against publisher records on 2026-09-24. Original methods retain their original sources.
export const MODULOS_REFERENCIAS = {
  sinais_vitais: 'Sinais vitais', posturografia: 'Posturografia',
  termografia: 'Termografia funcional', jump_test: 'Jump Test',
  bioimpedancia: 'Bioimpedância', antropometria: 'Antropometria',
  flexibilidade: 'Flexibilidade', forca: 'Força', rml: 'RML',
  cardiorrespiratorio: 'Cardiorrespiratório', biomecanica_corrida: 'Biomecânica da corrida',
} as const;
export type ModuloReferencia = keyof typeof MODULOS_REFERENCIAS;
export type SelecaoModulos = Record<string, unknown>;
export interface ReferenciaClinica {
  id: string; texto: string; url: string;
  modulos: readonly ModuloReferencia[]; nota?: string;
}

export const REFERENCIAS: readonly ReferenciaClinica[] = [
  {
    "id": "acsm-12",
    "texto": "ACSM. ACSM's Guidelines for Exercise Testing and Prescription. 12th ed. Wolters Kluwer; 2025.",
    "url": "https://acsm.org/education-resources/books/guidelines-exercise-testing-prescription/",
    "modulos": [
      "flexibilidade",
      "forca",
      "rml",
      "cardiorrespiratorio"
    ],
    "nota": "Diretriz geral; tabelas e limites numericos exigem verificacao do protocolo e da populacao de origem."
  },
  {
    "id": "aha-2025",
    "texto": "AHA/ACC et al. 2025 Guideline for the Prevention, Detection, Evaluation, and Management of High Blood Pressure in Adults. Circulation. 2025. doi:10.1161/CIR.0000000000001356.",
    "url": "https://doi.org/10.1161/CIR.0000000000001356",
    "modulos": [
      "sinais_vitais"
    ],
    "nota": "Referencia para pressao arterial em adultos, nao para todos os sinais vitais."
  },
  {
    "id": "kendall-6",
    "texto": "Conroy VM et al. Kendall's Muscles: Testing and Function with Posture and Pain. 6th ed. Wolters Kluwer; 2023.",
    "url": "https://shop.lww.com/Kendall-s-Muscles/p/9781975159894",
    "modulos": [
      "posturografia"
    ]
  },
  {
    "id": "tisem",
    "texto": "Moreira DG et al. Thermographic imaging in sports and exercise medicine: A Delphi study and consensus statement on the measurement of human skin temperature. J Therm Biol. 2017;69:155-162. doi:10.1016/j.jtherbio.2017.07.006.",
    "url": "https://pubmed.ncbi.nlm.nih.gov/29037377/",
    "modulos": [
      "termografia"
    ],
    "nota": "Padronizacao TISEM; temperatura superficial nao estabelece diagnostico isolado."
  },
  {
    "id": "thermal-control",
    "texto": "Lubkowska A, Pluta W. Infrared Thermography as a Non-Invasive Tool in Musculoskeletal Disease Rehabilitation: The Control Variables in Applicability. A Systematic Review. Appl Sci. 2022;12(9):4302. doi:10.3390/app12094302.",
    "url": "https://www.mdpi.com/2076-3417/12/9/4302",
    "modulos": [
      "termografia"
    ]
  },
  {
    "id": "jump-cohort",
    "texto": "Garcia-Pinillos F et al. Analisis del rendimiento en salto vertical, agilidad, velocidad y velocidad de golpeo en jovenes futbolistas: influencia de la edad. Apunts Med Esport. 2014;49(183):67-73. doi:10.1016/j.apunts.2014.05.002.",
    "url": "https://doi.org/10.1016/j.apunts.2014.05.002",
    "modulos": [
      "jump_test"
    ],
    "nota": "Somente o salto: coortes masculinas de futebol juvenil subelite, CMJ sem bracos, media de tres. Pela tecnica, corresponde ao VJ com maos na cintura adotado no equipamento; nao comparar ao CMJ com bracos livres nem extrapolar normas."
  },
  {
    "id": "jump-rsi",
    "texto": "Struzik A et al. Effect of drop jump technique on the reactive strength index. J Hum Kinet. 2016;52:157-164. doi:10.1515/hukin-2016-0003.",
    "url": "https://pubmed.ncbi.nlm.nih.gov/28149403/",
    "modulos": [
      "jump_test"
    ],
    "nota": "Tecnica e altura de queda afetam o RSI; nao estabelece altura universal de drop jump."
  },
  {
    "id": "jump-eur",
    "texto": "McGuigan MR et al. Eccentric utilization ratio: effect of sport and phase of training. J Strength Cond Res. 2006;20(4):992-995. doi:10.1519/R-19165.1.",
    "url": "https://pubmed.ncbi.nlm.nih.gov/17194252/",
    "modulos": [
      "jump_test"
    ],
    "nota": "EUR depende da variavel, modalidade e fase de treino; maior nao e necessariamente melhor."
  },
  {
    "id": "jump-15s",
    "texto": "Alvarez-Herms J et al. Differing levels of acute hypoxia do not influence maximal anaerobic power capacity. Wilderness Environ Med. 2015;26(1):78-82. doi:10.1016/j.wem.2014.07.014.",
    "url": "https://pubmed.ncbi.nlm.nih.gov/25541511/",
    "modulos": [
      "jump_test"
    ],
    "nota": "Exemplo de saltos repetidos de 15 segundos, nao tabela normativa nem validacao do algoritmo de potencia do equipamento."
  },
  {
    "id": "kyle-bia",
    "texto": "Kyle UG et al. Bioelectrical impedance analysis-part II: utilization in clinical practice. Clin Nutr. 2004. doi:10.1016/j.clnu.2004.09.012.",
    "url": "https://pubmed.ncbi.nlm.nih.gov/15556267/",
    "modulos": [
      "bioimpedancia"
    ]
  },
  {
    "id": "ewgsop2",
    "texto": "Cruz-Jentoft AJ et al. Sarcopenia: revised European consensus on definition and diagnosis (EWGSOP2). Age Ageing. 2019;48(1):16-31. doi:10.1093/ageing/afy169.",
    "url": "https://academic.oup.com/ageing/article/48/1/16/5126243",
    "modulos": [
      "bioimpedancia",
      "forca"
    ],
    "nota": "Interpretar forca, quantidade muscular e desempenho em conjunto, respeitando populacao e metodo. Nao diagnosticar por medida isolada."
  },
  {
    "id": "isak-2019",
    "texto": "Esparza-Ros F, Vaquero-Cristobal R, Marfell-Jones M. International Standards for Anthropometric Assessment. ISAK; 2019.",
    "url": "https://www.ausport.gov.au/ais/performance-support/anthropometry/additional-info/recommended-course-text",
    "modulos": [
      "antropometria"
    ]
  },
  {
    "id": "jackson-men",
    "texto": "Jackson AS, Pollock ML. Generalized equations for predicting body density of men. Br J Nutr. 1978;40:497-504. doi:10.1079/BJN19780152.",
    "url": "https://doi.org/10.1079/BJN19780152",
    "modulos": [
      "antropometria"
    ]
  },
  {
    "id": "jackson-women",
    "texto": "Jackson AS, Pollock ML, Ward A. Generalized equations for predicting body density of women. Med Sci Sports Exerc. 1980;12(3):175-181.",
    "url": "https://pubmed.ncbi.nlm.nih.gov/7402053/",
    "modulos": [
      "antropometria"
    ]
  },
  {
    "id": "siri",
    "texto": "Siri WE. Body composition from fluid spaces and density: analysis of methods. 1961. Reprinted in Nutrition. 1993;9(5):480-491.",
    "url": "https://pubmed.ncbi.nlm.nih.gov/8286893/",
    "modulos": [
      "antropometria"
    ]
  },
  {
    "id": "heath-carter",
    "texto": "Carter JEL, Heath BH. Somatotyping: Development and Applications. Cambridge University Press; 1990.",
    "url": "https://assets.cambridge.org/97805213/51171/sample/9780521351171ws.pdf",
    "modulos": [
      "antropometria"
    ]
  },
  {
    "id": "grip-norms",
    "texto": "Massy-Westropp NM et al. Hand Grip Strength: age and gender stratified normative data in a population-based study. BMC Res Notes. 2011;4:127. doi:10.1186/1756-0500-4-127.",
    "url": "https://pubmed.ncbi.nlm.nih.gov/21492469/",
    "modulos": [
      "forca"
    ]
  },
  {
    "id": "grip-pure",
    "texto": "Leong DP et al. Prognostic value of grip strength: findings from the Prospective Urban Rural Epidemiology (PURE) study. Lancet. 2015;386:266-273. doi:10.1016/S0140-6736(14)62000-6.",
    "url": "https://pubmed.ncbi.nlm.nih.gov/25982160/",
    "modulos": [
      "forca"
    ]
  },
  {
    "id": "rfd",
    "texto": "Maffiuletti NA et al. Rate of force development: physiological and methodological considerations. Eur J Appl Physiol. 2016;116:1091-1116. doi:10.1007/s00421-016-3346-6.",
    "url": "https://pubmed.ncbi.nlm.nih.gov/26941023/",
    "modulos": [
      "forca"
    ],
    "nota": "RFD exige controle de amostragem e processamento; nao valida automaticamente o hardware utilizado."
  },
  {
    "id": "senior-fitness",
    "texto": "Rikli RE, Jones CJ. Senior Fitness Test Manual. 2nd ed. Human Kinetics; 2013.",
    "url": "https://us.humankinetics.com/products/senior-fitness-test-manual-2nd-edition",
    "modulos": [
      "rml"
    ],
    "nota": "Testes funcionais em pessoas de 60 anos ou mais; nao extrapolar tabelas para jovens."
  },
  {
    "id": "mcgill-3",
    "texto": "McGill SM. Low Back Disorders: Evidence-Based Prevention and Rehabilitation. 3rd ed. Human Kinetics; 2016.",
    "url": "https://us.humankinetics.com/products/low-back-disorders-3rd-edition-online-ce-course-without-book",
    "modulos": [
      "rml"
    ]
  },
  {
    "id": "tanaka",
    "texto": "Tanaka H, Monahan KD, Seals DR. Age-predicted maximal heart rate revisited. J Am Coll Cardiol. 2001;37(1):153-156.",
    "url": "https://pubmed.ncbi.nlm.nih.gov/11153730/",
    "modulos": [
      "cardiorrespiratorio"
    ]
  },
  {
    "id": "novacheck",
    "texto": "Novacheck TF. The biomechanics of running. Gait Posture. 1998;7(1):77-95. doi:10.1016/S0966-6362(97)00038-6.",
    "url": "https://pubmed.ncbi.nlm.nih.gov/10200378/",
    "modulos": [
      "biomecanica_corrida"
    ]
  },
  {
    "id": "dicharry",
    "texto": "Dicharry J. Kinematics and kinetics of gait: from lab to clinic. Clin Sports Med. 2010;29(3):347-364. doi:10.1016/j.csm.2010.03.013.",
    "url": "https://pubmed.ncbi.nlm.nih.gov/20610026/",
    "modulos": [
      "biomecanica_corrida"
    ]
  },
  {
    "id": "heiderscheit",
    "texto": "Heiderscheit BC et al. Effects of step rate manipulation on joint mechanics during running. Med Sci Sports Exerc. 2011;43(2):296-302. doi:10.1249/MSS.0b013e3181ebedf4.",
    "url": "https://pubmed.ncbi.nlm.nih.gov/20581720/",
    "modulos": [
      "biomecanica_corrida"
    ],
    "nota": "Fundamentacao biomecanica; nao e a origem das faixas angulares operacionais importadas do aplicativo de captura."
  }
];

export function referenciasAvaliacao(modulos: SelecaoModulos = {}, anthropometry?: any): ReferenciaClinica[] {
  const rows = (Array.isArray(anthropometry) ? anthropometry : [anthropometry]).filter(Boolean);
  const onlyV2 = rows.length > 0 && rows.every(row => row.registro_v2?.version === 2);
  const refs = REFERENCIAS.filter(ref => ref.modulos.some(modulo => modulos[modulo] === true
    && !(modulo === 'antropometria' && onlyV2)));
  if (modulos.antropometria === true) for (const row of rows) {
    if (row.registro_v2?.version !== 2) continue;
    const snapshot = row.resultados_v2;
    const ids = new Set<string>((snapshot?.results ?? [])
      .filter((result: any) => result.selected && result.value != null)
      .flatMap((result: any) => result.referenceIds ?? []));
    for (const ref of snapshot?.references ?? []) {
      if (ids.has(ref.id) && !refs.some(item => item.id === ref.id)) {
        refs.push({ id: ref.id, texto: ref.text, url: ref.url ?? null, modulos: ['antropometria'] });
      }
    }
  }
  return refs;
}

export function textoReferencia(ref: ReferenciaClinica): string {
  return [ref.texto, ref.nota, ref.url].filter(Boolean).join(' ');
}

export function referenciasParaIA(modulos: SelecaoModulos = {}, anthropometry?: any): string {
  return referenciasAvaliacao(modulos, anthropometry).map(ref => `- ${textoReferencia(ref)}`).join('\n');
}

export function referenciasModulo(modulo: string): string {
  return referenciasParaIA({ [modulo]: true });
}

// Infer legacy records only when the selection map is absent, never for explicit false.
export function modulosDaAvaliacao(avaliacao: { modulos_selecionados?: SelecaoModulos | null }): SelecaoModulos {
  if (avaliacao.modulos_selecionados != null) return avaliacao.modulos_selecionados;
  return Object.fromEntries(Object.keys(MODULOS_REFERENCIAS).map(key => {
    const dados = avaliacao as Record<string, unknown>;
    const value = dados[key] ?? (key === 'cardiorrespiratorio' ? dados.cardio : undefined);
    return [key, Array.isArray(value) ? value.length > 0 : value != null];
  }));
}

export function modulosDoHistorico(avaliacoes: Parameters<typeof modulosDaAvaliacao>[0][]): SelecaoModulos {
  return Object.fromEntries(Object.keys(MODULOS_REFERENCIAS).map(key => [key,
    avaliacoes.some(avaliacao => modulosDaAvaliacao(avaliacao)[key] === true),
  ]));
}
