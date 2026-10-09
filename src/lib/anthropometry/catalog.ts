export function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
export const ENGINE_VERSION = 'anthropometry-2.2.0' as const;
export const CATALOG_VERSION = 'medfit-strict26-2026-10-09.3' as const;
const definitions = [
  ['mass','Massa corporal','kg','basic','Balanca calibrada; vestimenta minima'],
  ['height','Estatura','cm','basic','Vertex ao solo; plano de Frankfurt'],
  ['sittingHeight','Altura sentada','cm','basic','Vertex ao assento; plano de Frankfurt'],
  ['armSpan','Envergadura','cm','basic','Entre dactylion direito e esquerdo'],
  ['triceps','Triceps','mm','skinfold','Posterior do braco; nivel medio acromiale-radiale'],
  ['subscapular','Subescapular','mm','skinfold','Obliqua 2 cm lateral e inferior ao subscapulare'],
  ['biceps','Biceps','mm','skinfold','Anterior do braco; nivel medio acromiale-radiale'],
  ['iliacCrest','Crista iliaca','mm','skinfold','Imediatamente superior ao iliocristale; equivalente a suprailiaca de Durnin-Womersley, nao aos locais de Petroski/Jackson'],
  ['supraspinale','Supraespinal','mm','skinfold','Intersecao iliospinale-borda axilar anterior com horizontal do iliocristale'],
  ['abdominal','Abdominal','mm','skinfold','Vertical 5 cm a direita do omphalion'],
  ['thighSkinfold','Coxa anterior','mm','skinfold','Anterior, meio da prega inguinal a margem superior da patela'],
  ['calfSkinfold','Panturrilha medial','mm','skinfold','Face medial no nivel de perimetro maximo'],
  ['armRelaxed','Braco relaxado','cm','girth','Nivel medio acromiale-radiale, relaxado'],
  ['armFlexed','Braco flexionado e contraido','cm','girth','Perimetro maximo com braco flexionado e contraido'],
  ['forearm','Antebraco','cm','girth','Perimetro maximo do antebraco'],
  ['chest','Torax','cm','girth','Nivel mesosternale, fim de expiracao normal'],
  ['waist','Cintura minima','cm','girth','Menor perimetro entre rebordo costal e crista; nao cintura OMS'],
  ['abdomen','Abdomen','cm','girth','Perimetro horizontal no omphalion'],
  ['hip','Quadril','cm','girth','Perimetro maximo gluteo'],
  ['thighMax','Coxa maxima','cm','girth','Proximal, imediatamente distal a prega glutea'],
  ['thighMid','Coxa media','cm','girth','Nivel medio trochanterion-tibiale laterale'],
  ['calf','Panturrilha maxima','cm','girth','Perimetro maximo da panturrilha'],
  ['humerus','Diametro biepicondilar do umero','cm','breadth','Entre epicondilos do umero'],
  ['femur','Diametro biepicondilar do femur','cm','breadth','Entre epicondilos femorais'],
  ['wrist','Diametro biestiloide do punho','cm','breadth','Entre processos estiloides radial e ulnar'],
  ['bimalleolar','Diametro bimaleolar','cm','breadth','Entre maleolos; nao perimetro do tornozelo'],
] as const;
export type MeasurementId = typeof definitions[number][0];
export const CORRECTED_GIRTH_RESULT_IDS = deepFreeze([
  'armRelaxedCorrected',
  'chestCorrected',
  'thighMaxCorrected',
  'thighMidCorrected',
  'calfCorrected',
  'correctedGirthSum5',
] as const);
export const MEASUREMENTS = deepFreeze(definitions.map(([id,label,unit,group,landmark]) => ({
  id,label,unit,group,landmark,defaultSide:'D' as const,referenceIds:['ISAK_PADRONIZACAO'],
  protocolVersion:CATALOG_VERSION,discrepancyThreshold:group === 'skinfold' ? 5 : 1,
})));
export interface Reference { id:string; text:string; url:string|null }
export const REFERENCES: readonly Reference[] = deepFreeze([
  {id:'ISAK_PADRONIZACAO',text:'ISAK. International Standards for Anthropometric Assessment. Registrar a edicao efetivamente utilizada.',url:'https://www.isak.global/'},
  {id:'MARTIN_1990',text:'Martin AD, Spenst LF, Drinkwater DT, Clarys JP. Anthropometric estimation of muscle mass in men. Med Sci Sports Exerc. 1990;22(5):729-733. doi:10.1249/00005768-199010000-00027.',url:'https://pubmed.ncbi.nlm.nih.gov/2233214/'},
  {id:'LEE_2000',text:'Lee RC et al. Total-body skeletal muscle mass: development and cross-validation of anthropometric prediction models. Am J Clin Nutr. 2000;72(3):796-803. Modelo final de perimetros (Eq.4); errata de 2001 nao altera coeficientes.',url:'https://pubmed.ncbi.nlm.nih.gov/10966902/'},
  {id:'KERR_1988',text:'Kerr DA. An anthropometric method for fractionation of skin, adipose, bone, muscle and residual tissue masses in males and females age 6 to 77 years. Simon Fraser University; 1988. Tese de mestrado.',url:'https://summit.sfu.ca/item/5139'},
  {id:'MARTIN_OSSEO_1991',text:'Martin AD. Anthropometric assessment of bone mineral. In: Himes JH, ed. Anthropometric Assessment of Nutritional Status. Wiley-Liss; 1991:185-196. Atribuicao da formula fornecida pendente de verificacao no original.',url:null},
  {id:'ROCHA_1975',text:'Rocha MSL. Peso osseo do brasileiro de ambos os sexos de 17 a 25 anos. Arquivos de Anatomia e Antropologia. 1975;1:445-451.',url:'https://sajrsper.com/index.php/sajrsper/article/view/12/12'},
  {id:'CARTER_MANUAL',text:'Carter JEL. The Heath-Carter Anthropometric Somatotype: Instruction Manual. 2002; copia com paginas datadas de 2003. Classificacao simplificada em sete categorias.',url:'https://studylib.net/doc/8191486/the-heath-carter-anthropometric-somatotype'},
  {id:'ROSS_WILSON_1974',text:'Ross WD, Wilson NC. A stratagem for proportional growth assessment. 1974.',url:'https://pubmed.ncbi.nlm.nih.gov/4446980/'},
  {id:'PHANTOM_TABELA',text:'Ross WD, Marfell-Jones MJ. Kinanthropometry. In: Physiological Testing of the High-Performance Athlete. 2nd ed. Human Kinetics; 1991. Tabela fornecida na especificacao MedFit; verificacao integral da fonte primaria pendente.',url:null},
  {id:'MILLER_1980',text:'Miller R, Ross WD, Rapp A, Roede M. Sex Chromosome Aneuploidy and Anthropometry: A New Proportionality Assessment Using the Phantom Stratagem. Am J Med Genet. 1980;5:125-135.',url:null},
  {id:'DURNIN_RAHAMAN_1967',text:'Durnin JVGA, Rahaman MM. The assessment of the amount of fat in the human body from measurements of skinfold thickness. Br J Nutr. 1967;21(3):681-689. doi:10.1079/BJN19670070.',url:'https://pubmed.ncbi.nlm.nih.gov/6052883/'},
  {id:'DURNIN_WOMERSLEY_1974',text:'Durnin JVGA, Womersley J. Body fat assessed from total body density and its estimation from skinfold thickness: measurements on 481 men and women aged from 16 to 72 years. Br J Nutr. 1974;32(1):77-97. doi:10.1079/BJN19740060.',url:'https://pubmed.ncbi.nlm.nih.gov/4843734/'},
  {id:'PETROSKI_1995',text:'Petroski EL. Desenvolvimento e validacao de equacoes generalizadas para a estimativa da densidade corporal em adultos. Tese; 1995.',url:'https://pt.scribd.com/document/8955761/Tese-Edio-Petroski'},
  {id:'JACKSON_1980',text:'Jackson AS, Pollock ML, Ward A. Generalized equations for predicting body density of women. Med Sci Sports Exerc. 1980;12(3):175-181.',url:'https://pubmed.ncbi.nlm.nih.gov/7402053/'},
  {id:'SIRI_1961',text:'Siri WE. Body composition from fluid spaces and density: analysis of methods. In: Techniques for Measuring Body Composition. National Academy of Sciences; 1961:223-244.',url:null},
  {id:'MIRWALD_2002',text:'Mirwald RL et al. An assessment of maturity from anthropometric measurements. Med Sci Sports Exerc. 2002;34(4):689-694.',url:'https://pubmed.ncbi.nlm.nih.gov/11932580/'},
  {id:'KOZIEL_MALINA_2018',text:'Koziel SM, Malina RM. Modified Maturity Offset Prediction Equations: Validation in Independent Longitudinal Samples of Boys and Girls. Sports Med. 2018.',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC5752743/'},
  {id:'OMS_2000',text:'WHO. Obesity: preventing and managing the global epidemic. Technical Report Series 894; 2000.',url:'https://iris.who.int/handle/10665/42330'},
  {id:'OMS_CINTURA_2011',text:'WHO. Waist circumference and waist-hip ratio: report of a WHO expert consultation. 2011. Cintura no ponto medio costela-crista.',url:'https://iris.who.int/handle/10665/44583'},
  {id:'DUBOIS_1916',text:'Du Bois D, Du Bois EF. A formula to estimate the approximate surface area if height and weight be known. Arch Intern Med. 1916;17:863-871.',url:null},
  {id:'HARRIS_BENEDICT_1919',text:'Harris JA, Benedict FG. A Biometric Study of Basal Metabolism in Man. Carnegie Institution of Washington, Publication 279; 1919.',url:null},
]);
export interface Method {
  id:string; label:string; version:string; referenceIds:string[]; inputs:string[];
  expression:string; population:string; limitations:string; source:string; rounding:string;
}
const method = (id:string,label:string,referenceIds:string[],inputs:string[],expression:string,population:string,limitations:string):Method => ({
  id,label,referenceIds,inputs,expression,population,limitations,version:`${id}-strict26-v1`,
  source:'Especificacao MedFit 2.0 de 2026-09-28; ressalvas de verificacao por metodo',rounding:'Sem arredondamento interno',
});
export const METHODS: readonly Method[] = deepFreeze([
  method('direct','Medidas diretas e qualidade',['ISAK_PADRONIZACAO'],['26 medidas'],'Media de 2; mediana de 3; discrepancia simetrica >5% dobras, >1% demais','Coleta padronizada','Registrar manual e excecoes'),
  method('indices','Somatorios, indices e areas geometricas',[],['medidas nomeadas por resultado'],'Correcao P-pi*dobra/10; area P^2/(4*pi); indices como identidades aritmeticas','Descritores geometricos','Sem classificacao clinica implicita'),
  method('martin1990','Massa muscular - Martin, 1990',['MARTIN_1990'],['height','thighMidCorrected','forearm','calfCorrected'],'(H*(.0553*T^2+.0987*F^2+.0331*C^2)-2445)/1000; cm -> kg','12 cadaveres masculinos, 50-94 anos','Revisao de transferibilidade; antebraco sem correcao; R2 nao e precisao individual'),
  method('lee2000','Massa muscular - Lee, 2000',['LEE_2000'],['height','armRelaxedCorrected','thighMidCorrected','calfCorrected','age','sex','populationCategory'],'H_m*(.00744*A^2+.00088*T^2+.00441*C^2)+2.4*sexo-.048*idade+categoria+7.8; F=0/M=1; categoria -2/1.1/0','Adultos nao obesos, equacao final de perimetros','Adaptacao de landmarks: ISAK acromiale-radiale e trochanterion-tibiale nao correspondem aos locais originais; sempre revisar'),
  method('kerrMuscle1988','Massa muscular - Kerr, 1988',['KERR_1988'],['height','correctedGirthSum5'],'Z=(S*(170.18/H)-207.21)/13.74; kg=(24.5+4.4*Z)/(170.18/H)^3','Modelo anatomico, 6-77 anos','Componente isolado; correspondencia historica do local da coxa pendente'),
  method('kerrAdipose1988','Massa adiposa anatomica - Kerr, 1988',['KERR_1988'],['height','sum6'],'Z=(S6*(170.18/H)-116.41)/34.79; kg=(25.6+5.85*Z)/(170.18/H)^3','Modelo anatomico, 6-77 anos','Nao e gordura quimica nem fracionamento completo'),
  method('martinBone1991','Massa ossea estimada - Martin, 1991',['MARTIN_OSSEO_1991'],['height','humerus','femur','wrist','bimalleolar'],'0.6*H_cm*(Dumero+Dfemur+Dpunho+Dbimaleolar)^2*.0001; diametros cm','Aplicabilidade individual nao verificada','Formula fornecida na especificacao; fonte primaria pendente; nao DXA'),
  method('rocha1975','Massa ossea estimada - Rocha, 1975',['ROCHA_1975'],['height','wrist','femur'],'3.02*(H_m^2*Dpunho_m*Dfemur_m*400)^.712','Brasileiros, ambos os sexos, 17-25 anos','Transferibilidade populacional requer revisao; nao DXA'),
  method('heathCarter','Somatotipo Heath-Carter',['CARTER_MANUAL'],['height','mass','triceps','subscapular','supraspinale','humerus','femur','armFlexed','calf','calfSkinfold'],'Endo polinomio; meso correcao SEM pi; ecto HWR; componentes <=0 recebem .1','Descricao morfologica','Classificacao simplificada em sete categorias; nao diagnostica'),
  method('phantom','Proporcionalidade Phantom',['ROSS_WILSON_1974','PHANTOM_TABELA'],['height','variavel bruta'],'(V*(170.18/H)^d-P)/S; d=1 comprimentos,2 areas,3 massas','Modelo de proporcionalidade','Tabela da especificacao; verificacao integral primaria pendente; nao percentil ou ideal'),
  method('durninWomersley1974','Densidade corporal - Durnin, 1967/1974',['DURNIN_WOMERSLEY_1974'],['biceps','triceps','subscapular','iliacCrest','age','sex'],'DC=a-b*log10(S4); S4=biceps+triceps+subscapular+crista iliaca; Durnin-Rahaman aos 16 e Durnin-Womersley dos 17 aos 72','Adolescentes de 16 anos e adultos ate 72 anos','Estimativa populacional por densidade; coeficientes juvenis possuem fonte propria; crista iliaca ISAK corresponde a suprailiaca do metodo; nao confundir com supraespinal ou pontos de Petroski/Jackson'),
  method('petroski1995','Densidade - Petroski, 1995 (M7/F9)',['PETROSKI_1995'],['suprailiacaPetroski ausente','subscapular','triceps','calfSkinfold','age','mass','height'],'M:1.10726863-.00081201*S4+.00000212*S4^2-.00041761*idade; F:1.02902361-.00067159*S4+.00000242*S4^2-.00026073*idade-.00056009*M+.00054649*H','M 18-66; F 18-51 anos','Indisponivel strict26; nao substituir local'),
  method('jackson1980','Densidade - Jackson, Pollock e Ward, 1980',['JACKSON_1980'],['suprailiacaJackson ausente','triceps','thighSkinfold','age'],'1.0994921-.0009929*S3+.0000023*S3^2-.0001392*idade','Mulheres 18-55 anos','Indisponivel strict26; nao substituir local'),
  method('siri1961','Gordura quimica - Siri, 1961',['SIRI_1961'],['density','mass'],'%=495/DC-450; gordura=M*%/100; MLG=M-gordura','Modelo bicompartimental densitometrico','Depende de densidade estimada por equacao compativel; nao equivale a DXA'),
  method('mirwald2002','Maturacao estimada - Mirwald, 2002',['MIRWALD_2002','KOZIEL_MALINA_2018'],['height','sittingHeight','mass','age','sex'],'CMI=H-AS;R=100*M/H; M:-9.236+.0002708*CMI*AS-.001663*idade*CMI+.007216*idade*AS+.02292*R; F:-9.376+.0001882*CMI*AS+.0022*idade*CMI+.005841*idade*AS-.002658*idade*M+.07693*R','8-16 anos','Limitacoes individuais mesmo dentro da faixa; nao idade ossea'),
  method('bmiWHO','Classificacao IMC - OMS, 2000',['OMS_2000'],['bmi','age','pregnant'],'<18.5 baixo;<25 referencia;<30 sobrepeso;<35 I;<40 II;>=40 III','Adultos nao gestantes','Nao aplicar limites adultos a criancas'),
  method('waistWHO','Cintura - OMS, 2011',['OMS_CINTURA_2011'],['cintura ponto medio ausente'],'M 94/102 cm; F 80/88 cm','Adultos europideos; referencia escolhida','Cintura minima nao substitui cintura no ponto medio'),
  method('dubois1916','Superficie corporal - Du Bois, 1916',['DUBOIS_1916'],['mass','height'],'.007184*M_kg^.425*H_cm^.725','Modelo empirico historico','Estimativa de superficie'),
  method('harrisBenedict1919','Energia - Harris-Benedict original, 1919',['HARRIS_BENEDICT_1919'],['mass','height','age','sex'],'M:66.473+13.7516*M+5.0033*H-6.755*idade; F:655.0955+9.5634*M+1.8496*H-4.6756*idade; GET=TMB*FA','Modelo historico','Revisar aplicabilidade; nao calorimetria'),
  method('scenarios','Cenarios definidos pelo profissional',[],['metas e par de metodos explicitos'],'M_alvo=MLG/(1-%alvo/100); musculo_alvo=IMO_alvo*osso; M_alvo_IMC=IMC_alvo*H_m^2','Identidades algebricas','Nao previsao de resposta; nao peso ideal'),
]);
export const PHANTOM = deepFreeze([
  ['mass',64.58,8.60,3],['sittingHeight',90.78,4.54,1],['armSpan',173.03,4.30,1],
  ['triceps',15.40,4.47,1],['subscapular',17.20,5.07,1],['biceps',8,2,1],
  ['iliacCrest',22.40,6.80,1],['supraspinale',15.40,4.47,1],['abdominal',25.40,7.78,1],
  ['thighSkinfold',27,8.33,1],['calfSkinfold',16,4.67,1],['armRelaxed',26.89,2.33,1],
  ['armFlexed',29.41,2.37,1],['forearm',25.13,1.41,1],['chest',87.86,5.18,1],
  ['waist',71.91,4.45,1],['hip',94.67,5.58,1],['calf',35.25,2.30,1],
  ['humerus',6.48,.35,1],['femur',9.52,.48,1],['wrist',5.21,.28,1],['bimalleolar',6.68,.36,1],
] as const);
