export const REFERENCIAS_CLINICAS: Record<string, string[]> = {
  geral: [
    'CONFEF Resolução 046/2002: intervenção do Profissional de Educação Física em avaliação, orientação e prescrição de exercícios.',
    'Código de Ética Profissional do Sistema CONFEF/CREFs: atuação dentro da competência profissional, sem diagnóstico médico nosológico.',
    'Lei Federal 12.842/2013: diagnóstico de doenças e prescrição terapêutica médica são atos privativos do médico.',
    'COFFITO: diagnóstico cinético-funcional e avaliação fisioterapêutica são atos próprios da fisioterapia quando aplicável.',
  ],
  anamnese: [
    'ACSM Guidelines for Exercise Testing and Prescription, 12th ed.: triagem pré-participação, fatores de risco e segurança para exercício.',
    'PAR-Q+ / CSEP: rastreio de prontidão para atividade física e indicação de encaminhamento quando necessário.',
  ],
  sinais_vitais: [
    'ACC/AHA Guideline for High Blood Pressure in Adults, 2017: normal, elevada, hipertensão estágio 1, estágio 2 e crise hipertensiva.',
    'American Heart Association: leitura e interpretação de pressão arterial em adultos.',
  ],
  posturografia: [
    'Kendall et al. Muscles: Testing and Function with Posture and Pain: avaliação postural e função muscular.',
    'Sahrmann. Diagnosis and Treatment of Movement Impairment Syndromes: padrões de movimento, compensações e controle motor.',
  ],
  bioimpedancia: [
    'Kyle et al. Bioelectrical impedance analysis: utilization in clinical practice. Clin Nutr. 2004.',
    'EWGSOP2. Sarcopenia: revised European consensus. Age Ageing. 2019: ASMI e marcadores musculares.',
  ],
  antropometria: [
    'ISAK International Standards for Anthropometric Assessment: padronização de dobras, perímetros e diâmetros.',
    'Jackson & Pollock 7 skinfolds + Siri equation: estimativa de densidade corporal e percentual de gordura.',
    'Heath-Carter anthropometric somatotype method: endomorfia, mesomorfia e ectomorfia.',
  ],
  flexibilidade: [
    'ACSM Guidelines for Exercise Testing and Prescription, 12th ed.: Sit and Reach / Banco de Wells e interpretação por sexo e idade.',
  ],
  forca: [
    'Massy-Westropp et al. Hand Grip Strength normative data. BMC Research Notes. 2011.',
    'Leong et al. Prognostic value of grip strength. Lancet. 2015.',
    'ACSM Guidelines for Exercise Testing and Prescription, 12th ed.: força muscular, segurança e progressão de treinamento resistido.',
  ],
  rml: [
    'ACSM Guidelines for Exercise Testing and Prescription, 12th ed.: testes de resistência muscular localizada.',
    'Rikli & Jones. Senior Fitness Test Manual, 2nd ed.: testes funcionais em idosos.',
    'McGill. Low Back Disorders, 2nd ed.: endurance de tronco e controle lombopélvico.',
  ],
  cardiorrespiratorio: [
    'Tanaka et al. Age-predicted maximal heart rate revisited. J Am Coll Cardiol. 2001.',
    'ACSM Guidelines for Exercise Testing and Prescription, 12th ed.: VO2max, zonas de treinamento e prescrição aeróbica.',
    'American Heart Association: respostas cardiovasculares ao exercício e sinais de alerta.',
  ],
  biomecanica_corrida: [
    'Novacheck. The biomechanics of running. Gait & Posture. 1998.',
    'Dicharry. Kinematics and kinetics of gait: from lab to clinic. Clin Sports Med. 2010.',
    'Heiderscheit et al. Effects of step rate manipulation on joint mechanics during running. Med Sci Sports Exerc. 2011.',
  ],
  evolucao: [
    'ACSM Guidelines for Exercise Testing and Prescription, 12th ed.: monitoramento longitudinal, progressão de carga e segurança.',
    'EWGSOP2. Sarcopenia: revised European consensus. Age Ageing. 2019: acompanhamento de força, massa muscular e função.',
  ],
};

export function referenciasModulo(modulo: string) {
  const refs = [...REFERENCIAS_CLINICAS.geral, ...(REFERENCIAS_CLINICAS[modulo] ?? [])];
  return refs.map(r => `- ${r}`).join('\n');
}
