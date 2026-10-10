export const INDICE_MEDFIT_TITULO = 'Indice MedFit';

export const INDICE_MEDFIT_AVISO =
  'Indice operacional interno de 0 a 100 para acompanhamento longitudinal. Nao e uma norma populacional, diagnostico ou estimativa de risco.';

export const REGRAS_FORMULAS_IA = `Regras para formulas e indices:
- Diferencie medidas do equipamento, equacoes publicadas, tabelas normativas e indices operacionais MedFit.
- ${INDICE_MEDFIT_AVISO}
- Nao converta ausencia de dado em zero e nao recalcule valores sem todos os insumos exigidos.
- Nao classifique um resultado quando o protocolo, a populacao ou a fonte normativa compativel nao estiverem informados.
- Medidas derivadas devem ser interpretadas com as limitacoes do metodo e nunca substituir avaliacao clinica.`;

export type TipoFormulaClinica =
  | 'equacao_publicada'
  | 'tabela_normativa'
  | 'metrica_descritiva'
  | 'valor_equipamento'
  | 'indice_operacional';

export interface FormulaClinicaAuditada {
  id: string;
  modulo: string;
  nome: string;
  tipo: TipoFormulaClinica;
  referencia?: string;
  observacao: string;
}

// Inventario de rastreabilidade. Os detalhes, entradas e limitacoes estao em
// docs/AUDITORIA_FORMULAS.md; esta lista permite testes automaticos de cobertura.
export const FORMULAS_CLINICAS: readonly FormulaClinicaAuditada[] = [
  { id: 'antro-imc', modulo: 'antropometria', nome: 'IMC', tipo: 'equacao_publicada', referencia: 'OMS_2000', observacao: 'Indice de massa corporal; nao descreve composicao corporal isoladamente.' },
  { id: 'antro-durnin-siri', modulo: 'antropometria', nome: 'Percentual de gordura por densidade e Siri', tipo: 'equacao_publicada', referencia: 'DURNIN_RAHAMAN_1967|DURNIN_WOMERSLEY_1974|SIRI_1961', observacao: 'Usa somente os sitios exigidos pela equacao selecionada.' },
  { id: 'antro-martin', modulo: 'antropometria', nome: 'Massa muscular de Martin', tipo: 'equacao_publicada', referencia: 'MARTIN_1990', observacao: 'Estimativa antropometrica, nao metodo de imagem.' },
  { id: 'antro-lee', modulo: 'antropometria', nome: 'Massa muscular de Lee', tipo: 'equacao_publicada', referencia: 'LEE_2000', observacao: 'Estimativa antropometrica dependente da populacao de origem.' },
  { id: 'antro-kerr', modulo: 'antropometria', nome: 'Fracionamento de Kerr', tipo: 'equacao_publicada', referencia: 'KERR_1988', observacao: 'Fracionamento antropometrico em cinco componentes.' },
  { id: 'antro-rocha', modulo: 'antropometria', nome: 'Massa ossea de Rocha', tipo: 'equacao_publicada', referencia: 'ROCHA_1975', observacao: 'Estimativa antropometrica; nao equivale a DXA ou densidade mineral.' },
  { id: 'antro-heath-carter', modulo: 'antropometria', nome: 'Somatotipo Heath-Carter', tipo: 'equacao_publicada', referencia: 'CARTER_MANUAL', observacao: 'Descricao morfologica, sem inferencia determinista.' },
  { id: 'antro-phantom', modulo: 'antropometria', nome: 'Z-score Phantom', tipo: 'equacao_publicada', referencia: 'ROSS_WILSON_1974|PHANTOM_TABELA', observacao: 'Proporcionalidade corporal, nao faixa de normalidade.' },
  { id: 'antro-mirwald', modulo: 'antropometria', nome: 'Offset maturacional de Mirwald', tipo: 'equacao_publicada', referencia: 'MIRWALD_2002|KOZIEL_MALINA_2018', observacao: 'Estimativa com limitacoes individuais e faixa etaria restrita; nao e idade ossea.' },
  { id: 'antro-dubois', modulo: 'antropometria', nome: 'Superficie corporal de Du Bois', tipo: 'equacao_publicada', referencia: 'DUBOIS_1916', observacao: 'Estimativa empirica historica.' },
  { id: 'antro-harris-benedict', modulo: 'antropometria', nome: 'TMB Harris-Benedict original', tipo: 'equacao_publicada', referencia: 'HARRIS_BENEDICT_1919', observacao: 'Estimativa historica; nao equivale a calorimetria indireta.' },
  { id: 'cardio-zonas-fcmax', modulo: 'cardiorrespiratorio', nome: 'Zonas por percentual da FCmax', tipo: 'metrica_descritiva', referencia: 'acsm-12', observacao: 'Faixas percentuais genericas, nao substituem limiares medidos.' },
  { id: 'cardio-friend-2018', modulo: 'cardiorrespiratorio', nome: 'VO2max previsto FRIEND 2018', tipo: 'equacao_publicada', referencia: 'friend-2018', observacao: 'Usa idade, sexo, peso, estatura e modalidade. Produz VO2 previsto e percentual do previsto, nao percentil populacional.' },
  { id: 'cardio-zonas-friel', modulo: 'cardiorrespiratorio', nome: 'Zonas por frequencia cardiaca de limiar', tipo: 'metrica_descritiva', referencia: 'friel-zones', observacao: 'Metodo de Joe Friel por percentual da FC de limiar, com faixas especificas para corrida e ciclismo.' },
  { id: 'cardio-recuperacao-fc', modulo: 'cardiorrespiratorio', nome: 'Variacao da FC apos o esforco', tipo: 'metrica_descritiva', referencia: 'cole-1999', observacao: 'Preserva o sinal: negativo indica queda e positivo indica subida; o corte depende do protocolo.' },
  { id: 'cardio-score', modulo: 'cardiorrespiratorio', nome: 'Indice cardio MedFit', tipo: 'indice_operacional', observacao: INDICE_MEDFIT_AVISO },
  { id: 'flex-wells', modulo: 'flexibilidade', nome: 'Classificacao do Banco de Wells', tipo: 'tabela_normativa', referencia: 'acsm-12', observacao: 'Classificacao por sexo e idade; nao e exibida como percentil.' },
  { id: 'flex-score', modulo: 'flexibilidade', nome: 'Indice de flexibilidade MedFit', tipo: 'indice_operacional', observacao: INDICE_MEDFIT_AVISO },
  { id: 'forca-assimetria', modulo: 'forca', nome: 'Assimetria bilateral', tipo: 'metrica_descritiva', observacao: 'Diferenca relativa ao maior lado; limiar universal nao presumido.' },
  { id: 'forca-relativa', modulo: 'forca', nome: 'Forca relativa', tipo: 'metrica_descritiva', observacao: 'Razao kgf/peso corporal.' },
  { id: 'forca-rfd', modulo: 'forca', nome: 'Taxa de desenvolvimento de forca', tipo: 'metrica_descritiva', referencia: 'rfd', observacao: 'Sensivel a amostragem, filtragem e definicao do inicio da contracao.' },
  { id: 'forca-score', modulo: 'forca', nome: 'Indice de forca MedFit', tipo: 'indice_operacional', observacao: INDICE_MEDFIT_AVISO },
  { id: 'rml-score', modulo: 'rml', nome: 'Indice RML MedFit', tipo: 'indice_operacional', observacao: INDICE_MEDFIT_AVISO },
  { id: 'jump-altura', modulo: 'jump_test', nome: 'Altura pelo tempo de voo', tipo: 'metrica_descritiva', observacao: 'Modelo balistico g*t^2/8; depende da postura equivalente na decolagem e aterrissagem.' },
  { id: 'jump-rsi', modulo: 'jump_test', nome: 'RSI', tipo: 'metrica_descritiva', referencia: 'jump-rsi', observacao: 'Altura em metros dividida pelo tempo de contato em segundos.' },
  { id: 'jump-eur', modulo: 'jump_test', nome: 'EUR', tipo: 'metrica_descritiva', referencia: 'jump-eur', observacao: 'Razao entre medias validas; depende da tecnica e da variavel selecionada.' },
  { id: 'jump-assimetria', modulo: 'jump_test', nome: 'Assimetria bilateral', tipo: 'metrica_descritiva', observacao: 'Diferenca relativa ao maior lado; nao indica lesao.' },
  { id: 'jump-cv', modulo: 'jump_test', nome: 'Coeficiente de variacao', tipo: 'metrica_descritiva', observacao: 'Desvio-padrao amostral dividido pela media.' },
  { id: 'biomecanica-faixas', modulo: 'biomecanica_corrida', nome: 'Faixas angulares importadas', tipo: 'tabela_normativa', observacao: 'Faixas operacionais reproduzidas do aplicativo de captura; bibliografia geral nao e apresentada como origem numerica.' },
  { id: 'termografia-delta', modulo: 'termografia', nome: 'Delta termico bilateral', tipo: 'metrica_descritiva', referencia: 'tisem', observacao: 'Diferenca absoluta entre ROIs comparaveis; sinalizacao de triagem sem diagnostico.' },
  { id: 'composicao-score', modulo: 'composicao', nome: 'Indice de composicao MedFit', tipo: 'indice_operacional', observacao: INDICE_MEDFIT_AVISO },
  { id: 'postura-score', modulo: 'posturografia', nome: 'Indice postural MedFit', tipo: 'indice_operacional', observacao: INDICE_MEDFIT_AVISO },
  { id: 'global-score', modulo: 'global', nome: 'Indice global MedFit', tipo: 'indice_operacional', observacao: INDICE_MEDFIT_AVISO },
  { id: 'nutricao-mifflin', modulo: 'plano_alimentar', nome: 'TMB Mifflin-St Jeor', tipo: 'equacao_publicada', referencia: 'mifflin-1990', observacao: 'Estimativa de gasto em repouso para adultos; nao e calorimetria indireta.' },
  { id: 'nutricao-macros', modulo: 'plano_alimentar', nome: 'Distribuicao de macronutrientes e agua', tipo: 'indice_operacional', observacao: 'Parametros editaveis do modelo; nao devem ser tratados como prescricao universal.' },
] as const;
