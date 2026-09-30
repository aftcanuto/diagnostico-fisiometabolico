import { CATALOG_VERSION, ENGINE_VERSION, MEASUREMENTS, METHODS, PHANTOM, REFERENCES, deepFreeze, type MeasurementId } from './catalog';
import { anthropometrySchema, type AnthropometryInput } from './schema';
import { consolidateMeasurement, decimalAge } from './quality';
import { classifySomatotype, correctedGirth, ectomorphy, kerrComponent, leeMuscle, martinBone, martinMuscle, mirwaldOffset, phantomZ, rochaBone, somatotypeGirth } from './formulas';
import type { AnthropometryResults, CalculationContext, MeasurementQuality, Result, Status } from './types';

type Options = {review?:string;block?:{status:Status;reason:string};allowNegative?:boolean;allowZero?:boolean;extra?:Result['inputs'];references?:string[]};
const unique = <T>(values:T[]) => [...new Set(values)];
const missingSite = 'Local suprailiaco especifico da equacao ausente no conjunto estrito de 26 medidas. Crista iliaca e supraespinal ISAK nao sao substitutos.';
const rank:Record<Status,number> = {available:0,review:1,missing:2,invalid:3};

export function calculateAnthropometry(raw:AnthropometryInput, context:CalculationContext):AnthropometryResults {
  const input = anthropometrySchema.parse(raw);
  const age = decimalAge(context.date,context.birthDate);
  const sexValid = context.sex === 'M' || context.sex === 'F';
  const ageBlock = age === null ? {status:'invalid' as const,reason:'Datas invalidas ou nascimento posterior a avaliacao'} : undefined;
  const sexBlock = !sexValid ? {status:'invalid' as const,reason:'Sexo da equacao deve ser M ou F explicito'} : undefined;
  const measurements = Object.fromEntries(MEASUREMENTS.map(m => [m.id,consolidateMeasurement(m.id,input.measurements[m.id])])) as Record<MeasurementId,MeasurementQuality>;
  if (measurements.sittingHeight.value !== null && measurements.height.value !== null && measurements.sittingHeight.value >= measurements.height.value) {
    measurements.sittingHeight = {...measurements.sittingHeight,value:null,status:'invalid',reason:'Altura sentada deve ser menor que estatura'};
  }
  const rows:Result[] = [], phantom:Result[] = [];
  const byId = new Map<string,Result>();
  function add(id:string,label:string,unit:string,methodId:string,deps:string[],fn:(v:Record<string,number>)=>number|null,options:Options = {}):Result {
    const method = METHODS.find(m => m.id === methodId)!;
    const depRows = deps.map(dep => byId.get(dep));
    const inputs:Result['inputs'] = Object.fromEntries(deps.map((dep,i) => [dep,depRows[i]?.value ?? null]));
    Object.assign(inputs,options.extra);
    const references = unique([...method.referenceIds,...depRows.flatMap(r => r?.referenceIds ?? []),...(options.references ?? [])]);
    let status:Status = 'available';
    const reasons:string[] = [];
    for (let i=0;i<deps.length;i++) {
      const row = depRows[i];
      const state = !row || row.value === null && row.status !== 'invalid' ? 'missing' : row.status;
      if (rank[state] > rank[status]) status = state;
      if (state !== 'available') reasons.push(`${deps[i]}: ${row?.reason || 'faltam dados'}`);
    }
    if (options.review) { if (status === 'available') status = 'review'; reasons.push(options.review); }
    if (options.block) { status = options.block.status; reasons.push(options.block.reason); }
    let value:number|null = null;
    if (!options.block && (status === 'available' || status === 'review') && depRows.every(r => r && r.value !== null)) {
      value = fn(Object.fromEntries(depRows.map((r,i) => [deps[i],r!.value!])));
      if (value === null || !Number.isFinite(value) || (!options.allowNegative && (value < 0 || value === 0 && !options.allowZero))) {
        value = null; status = 'invalid'; reasons.push('Resultado nao finito ou fora do dominio matematico permitido');
      }
    }
    const result:Result = {id,label,unit,methodId,methodVersion:method.version,referenceIds:references,inputs,value,status,reason:unique(reasons).join('; '),selected:input.methods.includes(methodId),classification:null};
    rows.push(result); byId.set(id,result); return result;
  }
  for (const m of MEASUREMENTS) {
    const q = measurements[m.id];
    const method = METHODS.find(m => m.id === 'direct')!;
    const row:Result = {id:m.id,label:m.label,value:q.value,unit:m.unit,status:q.status,reason:q.reason,methodId:'direct',methodVersion:method.version,referenceIds:[...m.referenceIds],selected:input.methods.includes('direct'),classification:null,
      inputs:{reading1:q.readings[0],reading2:q.readings[1],reading3:q.readings[2],side:q.side,exception:q.exception,landmark:m.landmark,protocolVersion:m.protocolVersion,manualEdition:input.manualEdition}};
    rows.push(row); byId.set(row.id,row);
  }
  const sums: Array<[string,string,MeasurementId[]]> = [
    ['sum6','Somatorio de 6 dobras',['triceps','subscapular','supraspinale','abdominal','thighSkinfold','calfSkinfold']],
    ['sum8','Somatorio de 8 dobras',['triceps','subscapular','biceps','iliacCrest','supraspinale','abdominal','thighSkinfold','calfSkinfold']],
    ['sum6Upper','Somatorio de 6 dobras de tronco/membros superiores',['triceps','subscapular','biceps','iliacCrest','supraspinale','abdominal']],
    ['sum2Lower','Somatorio de 2 dobras de membros inferiores',['thighSkinfold','calfSkinfold']],
  ];
  for (const [id,label,deps] of sums) add(id,label,'mm','indices',deps,v => deps.reduce((sum,key) => sum+v[key],0));
  const corrections:Array<[MeasurementId,MeasurementId]> = [['armRelaxed','triceps'],['chest','subscapular'],['thighMax','thighSkinfold'],['thighMid','thighSkinfold'],['calf','calfSkinfold']];
  for (const [girth,fold] of corrections) add(`${girth}Corrected`,`${measurements[girth].label} corrigido`,'cm','indices',[girth,fold],v => correctedGirth(v[girth],v[fold]));
  const girths = ['armRelaxedCorrected','forearm','chestCorrected','thighMidCorrected','calfCorrected'];
  add('correctedGirthSum5','Somatorio de cinco perimetros (quatro corrigidos)','cm','indices',girths,v => girths.reduce((s,key) => s+v[key],0));
  add('bmi','IMC','kg/m2','indices',['mass','height'],v => v.mass/(v.height/100)**2);
  add('waistHipRatio','Relacao cintura/quadril','razao','indices',['waist','hip'],v => v.waist/v.hip);
  add('waistHeightRatio','Relacao cintura/estatura','razao','indices',['waist','height'],v => v.waist/v.height);
  add('cormicIndex','Indice cormico','%','indices',['sittingHeight','height'],v => 100*v.sittingHeight/v.height);
  add('armSpanHeightRatio','Relacao envergadura/estatura','razao','indices',['armSpan','height'],v => v.armSpan/v.height);
  add('hwr','Indice ponderal HWR','cm/kg^(1/3)','indices',['height','mass'],v => v.height/Math.cbrt(v.mass));
  add('armTotalArea','Area total geometrica do braco','cm2','indices',['armRelaxed'],v => v.armRelaxed**2/(4*Math.PI));
  add('armInnerArea','Area interna geometrica do braco (inclui osso)','cm2','indices',['armRelaxedCorrected'],v => v.armRelaxedCorrected**2/(4*Math.PI));
  add('armAdiposeArea','Area adiposa geometrica do braco','cm2','indices',['armTotalArea','armInnerArea'],v => v.armTotalArea-v.armInnerArea,{allowZero:true});
  add('bodySurfaceArea','Superficie corporal estimada','m2','dubois1916',['mass','height'],v => .007184*v.mass**.425*v.height**.725,{review:'Modelo empirico historico; revisar aplicabilidade individual'});

  const martinWarning = `Estimativa derivada de 12 cadaveres masculinos de 50-94 anos; transferibilidade individual nao estabelecida${context.sex !== 'M' ? '; sexo fora da amostra original' : ''}${age !== null && (age < 50 || age > 94) ? '; idade fora da amostra original' : ''}`;
  add('martin1990','Massa muscular - Martin, 1990','kg','martin1990',['height','thighMidCorrected','forearm','calfCorrected'],v => martinMuscle({height:v.height,thigh:v.thighMidCorrected,forearm:v.forearm,calf:v.calfCorrected}),{review:martinWarning,extra:{age,sex:context.sex},block:sexBlock ?? ageBlock});
  const category = input.populationCategory === null ? null : {asian:-2,africanAmerican:1.1,whiteHispanic:0}[input.populationCategory];
  const leeWarning = 'Adaptacao anatomica: ISAK acromiale-radiale e trochanterion-tibiale diferem de acromion-olecranon e prega inguinal-patela originais; nao afirmar equivalencia ou classificar' + (age !== null && age < 18 ? '; nao adulto' : '') + ((byId.get('bmi')?.value ?? 0) >= 30 ? '; fora do desenvolvimento em nao obesos' : '');
  add('lee2000','Massa muscular - Lee, 2000 (adaptacao de protocolo)','kg','lee2000',['height','armRelaxedCorrected','thighMidCorrected','calfCorrected'],v => leeMuscle({height:v.height,arm:v.armRelaxedCorrected,thigh:v.thighMidCorrected,calf:v.calfCorrected,age:age!,sex:context.sex,category:category!}),{review:leeWarning,extra:{age,sex:context.sex,populationCategory:input.populationCategory,categoryCoefficient:category},block:sexBlock ?? ageBlock ?? (category === null ? {status:'missing',reason:'Selecionar explicitamente a categoria historica de Lee; desconhecida nao equivale a zero'} : undefined)});
  const kerrAge = age === null ? '; idade desconhecida' : age < 6 || age > 77 ? '; idade fora de 6-77 anos' : '';
  add('kerrMuscle1988','Massa muscular - Kerr, 1988','kg','kerrMuscle1988',['height','correctedGirthSum5'],v => kerrComponent({height:v.height,sum:v.correctedGirthSum5,component:'muscle'}),{review:`Componente isolado; correspondencia historica do landmark da coxa pendente${kerrAge}`,extra:{age}});
  add('kerrAdipose1988','Massa adiposa anatomica - Kerr, 1988','kg','kerrAdipose1988',['height','sum6'],v => kerrComponent({height:v.height,sum:v.sum6,component:'adipose'}),{review:`Massa adiposa anatomica, nao gordura quimica; revisar aplicabilidade individual${kerrAge}`,extra:{age}});
  add('martinBone1991','Massa ossea estimada - Martin, 1991','kg','martinBone1991',['height','humerus','femur','wrist','bimalleolar'],v => martinBone({height:v.height,humerus:v.humerus,femur:v.femur,wrist:v.wrist,bimalleolar:v.bimalleolar}),{review:'Formula fornecida na especificacao; verificacao da equacao na fonte primaria pendente. Nao e conteudo mineral ou DXA'});
  add('rocha1975','Massa ossea estimada - Rocha, 1975','kg','rocha1975',['height','wrist','femur'],v => rochaBone({height:v.height,wrist:v.wrist,femur:v.femur}),{review:`Amostra brasileira de 17-25 anos; revisar transferibilidade${age === null || age < 17 || age > 25 ? '; idade fora da faixa ou desconhecida' : ''}`,extra:{age}});
  for (const id of ['martin1990','lee2000','kerrMuscle1988','kerrAdipose1988','martinBone1991','rocha1975']) {
    const absolute = byId.get(id)!;
    const mass = byId.get('mass')?.value;
    if (absolute.value !== null && mass !== null && mass !== undefined && absolute.value > mass) {
      absolute.status = 'review'; absolute.reason += '; componente estimado excede massa corporal: revisar medidas e aplicabilidade';
    }
    add(`${id}Percent`,`${absolute.label} / massa corporal`,'%',id,[id,'mass'],v => 100*v[id]/v.mass);
  }
  const {muscleMethod,boneMethod} = input.targets;
  const pairBlock = muscleMethod === null || boneMethod === null ? {status:'missing' as const,reason:'Selecionar explicitamente o par de metodos muscular e osseo'} : undefined;
  const pairDeps = muscleMethod && boneMethod ? [muscleMethod,boneMethod] : [];
  add('muscleBoneRatio','Indice musculo/osseo','kg/kg','scenarios',pairDeps,v => muscleMethod && boneMethod ? v[muscleMethod]/v[boneMethod] : null,{block:pairBlock,extra:{muscleMethod,boneMethod}});

  const endo = add('endomorphy','Endomorfia','componente','heathCarter',['triceps','subscapular','supraspinale','height'],v => {
    const x = (v.triceps+v.subscapular+v.supraspinale)*170.18/v.height;
    return -.7182+.1451*x-.00068*x*x+.0000014*x*x*x;
  },{allowNegative:true,allowZero:true});
  add('somatoArmCorrected','Braco corrigido para somatotipo (sem pi)','cm','heathCarter',['armFlexed','triceps'],v => somatotypeGirth(v.armFlexed,v.triceps));
  add('somatoCalfCorrected','Panturrilha corrigida para somatotipo (sem pi)','cm','heathCarter',['calf','calfSkinfold'],v => somatotypeGirth(v.calf,v.calfSkinfold));
  const meso = add('mesomorphy','Mesomorfia','componente','heathCarter',['humerus','femur','somatoArmCorrected','somatoCalfCorrected','height'],v => .858*v.humerus+.601*v.femur+.188*v.somatoArmCorrected+.161*v.somatoCalfCorrected-.131*v.height+4.5,{allowNegative:true,allowZero:true});
  const ecto = add('ectomorphy','Ectomorfia','componente','heathCarter',['hwr'],v => ectomorphy(v.hwr),{allowNegative:true,allowZero:true});
  for (const component of [endo,meso,ecto]) {
    if (component.value !== null && component.value <= 0) {
      component.inputs.rawComponent = component.value; component.value = .1; component.status = 'review';
      component.reason += '; componente nao positivo recebeu 0.1 conforme manual; revisar coleta';
    }
  }
  const x = add('somatoX','Somatocarta X','coordenada','heathCarter',['ectomorphy','endomorphy'],v => v.ectomorphy-v.endomorphy,{allowNegative:true,allowZero:true});
  const y = add('somatoY','Somatocarta Y','coordenada','heathCarter',['mesomorphy','endomorphy','ectomorphy'],v => 2*v.mesomorphy-v.endomorphy-v.ectomorphy,{allowNegative:true,allowZero:true});
  const somatoStatus = [endo,meso,ecto].reduce<Status>((s,r) => rank[r.status] > rank[s] ? r.status:s,'available');
  const classification = endo.value !== null && meso.value !== null && ecto.value !== null ? classifySomatotype(endo.value,meso.value,ecto.value) : null;
  for (const row of [endo,meso,ecto,x,y]) row.classification = classification;

  for (const [id,p,s,d] of PHANTOM) {
    const row = add(`phantom_${id}`,`Phantom - ${measurements[id].label}`,'Z','phantom',[id,'height'],v => phantomZ({value:v[id],height:v.height,mean:p,sd:s,dimension:d}),{allowNegative:true,allowZero:true,review:'Modelo de proporcionalidade, nao percentil ou ideal; tabela fornecida na especificacao, verificacao integral da fonte primaria pendente',extra:{P:p,S:s,dimension:d,referenceHeight:170.18,tableVersion:CATALOG_VERSION},references:id === 'sittingHeight' || id === 'armSpan' ? ['MILLER_1980']:[]});
    rows.pop(); phantom.push(row);
  }
  add('petroskiDensity','Densidade - Petroski M7/F9','g/cm3','petroski1995',[],() => null,{block:{status:'missing',reason:missingSite},extra:{age,sex:context.sex}});
  add('jacksonDensity','Densidade - Jackson, Pollock e Ward','g/cm3','jackson1980',[],() => null,{block:{status:'missing',reason:missingSite+(context.sex === 'M' ? ' Equacao desenvolvida para mulheres.' : '')},extra:{age,sex:context.sex}});
  add('fatPercent','Gordura quimica - Siri','%','siri1961',[],() => null,{block:{status:'missing',reason:'Sem metodo de densidade com landmarks compativeis no conjunto estrito de 26 medidas; Kerr nao fornece gordura quimica'}});
  add('fatMass','Massa de gordura quimica','kg','siri1961',['mass','fatPercent'],v => v.mass*v.fatPercent/100,{allowZero:true});
  add('fatFreeMass','Massa livre de gordura quimica','kg','siri1961',['mass','fatMass'],v => v.mass-v.fatMass);
  add('fatFreePercent','Massa livre de gordura quimica','%','siri1961',['fatPercent'],v => 100-v.fatPercent,{allowZero:true});

  const maturityBlock = sexBlock ?? ageBlock ?? (age! < 8 || age! > 16 ? {status:'review' as const,reason:'Mirwald indisponivel fora de 8-16 anos; nao aplicar a adultos'} : undefined);
  const maturity = add('maturityOffset','Anos em relacao ao PVC estimado','anos','mirwald2002',['height','sittingHeight','mass'],v => mirwaldOffset({height:v.height,sittingHeight:v.sittingHeight,mass:v.mass,age:age!,sex:context.sex}),{allowNegative:true,allowZero:true,review:'Estimativa limitada mesmo entre 8-16 anos, especialmente distante do PVC; nao e idade ossea ou diagnostico puberal',block:maturityBlock,extra:{age,sex:context.sex}});
  // A review-only applicability block must not yield a numerical estimate.
  if (maturityBlock) { maturity.value = null; maturity.status = maturityBlock.status; }
  const peak = add('peakHeightVelocityAge','Idade estimada do PVC','anos','mirwald2002',['maturityOffset'],v => age!-v.maturityOffset,{extra:{age}});
  if (maturity.value !== null) maturity.classification = maturity.value < 0 ? 'Antes do PVC estimado' : maturity.value > 0 ? 'Depois do PVC estimado' : 'No PVC estimado';
  if (peak.value !== null && peak.value <= 0) { peak.value = null; peak.status = 'invalid'; }
  const bmiClass = add('bmiClassification','Classificacao de IMC em adulto nao gestante','kg/m2','bmiWHO',['bmi'],v => v.bmi,{block:ageBlock ?? (age! < 18 || input.pregnant !== false ? {status:'missing',reason:'Classificacao adulta exige idade >=18 anos e ausencia de gestacao explicitamente registrada'} : undefined),extra:{age,pregnant:input.pregnant}});
  if (bmiClass.value !== null && bmiClass.status === 'available') {
    const bmi = bmiClass.value;
    bmiClass.classification = bmi < 18.5 ? 'Baixo peso' : bmi < 25 ? 'Faixa de referencia' : bmi < 30 ? 'Sobrepeso' : bmi < 35 ? 'Obesidade I' : bmi < 40 ? 'Obesidade II' : 'Obesidade III';
  }
  add('waistClassification','Classificacao de cintura - OMS','cm','waistWHO',[],() => null,{block:{status:'missing',reason:'Cintura minima ISAK nao corresponde ao ponto medio costela-crista da OMS; sem medida complementar no strict26'}});
  add('basalEnergy','Metabolismo basal estimado - Harris-Benedict','kcal/dia','harrisBenedict1919',['mass','height'],v => context.sex === 'M' ? 66.473+13.7516*v.mass+5.0033*v.height-6.755*age! : 655.0955+9.5634*v.mass+1.8496*v.height-4.6756*age!,{review:'Modelo historico: revisar aplicabilidade individual; nao calorimetria'+(age !== null && age < 18 ? '; menor de idade fora da aplicacao adulta habitual' : ''),block:sexBlock ?? ageBlock,extra:{age,sex:context.sex}});
  add('totalEnergy','Cenario de gasto energetico total','kcal/dia','harrisBenedict1919',['basalEnergy'],v => v.basalEnergy*input.activityFactor!,{block:input.activityFactor === null ? {status:'missing',reason:'Fator de atividade nao informado'} : input.activityFactor <= 0 ? {status:'invalid',reason:'Fator de atividade deve ser positivo'} : !input.activityJustification.trim() ? {status:'missing',reason:'Registrar justificativa do fator de atividade'} : undefined,extra:{activityFactor:input.activityFactor,activityJustification:input.activityJustification}});
  const goalBlock = (goal:number|null,percent=false) => goal === null ? {status:'missing' as const,reason:'Meta nao definida pelo profissional'} : goal <= 0 || percent && goal >= 100 ? {status:'invalid' as const,reason:'Meta fora do dominio permitido'} : undefined;
  add('targetMassByFat','Cenario de massa por gordura alvo','kg','scenarios',['fatFreeMass'],v => v.fatFreeMass/(1-input.targets.fatPercent!/100),{block:goalBlock(input.targets.fatPercent,true),extra:{fatPercentTarget:input.targets.fatPercent},review:'Cenario assume manutencao da MLG quimica'});
  add('targetFatMass','Cenario de gordura alvo','kg','scenarios',['targetMassByFat','fatFreeMass'],v => v.targetMassByFat-v.fatFreeMass,{allowZero:true});
  add('fatMassChange','Cenario de variacao de gordura','kg','scenarios',['targetFatMass','fatMass'],v => v.targetFatMass-v.fatMass,{allowNegative:true,allowZero:true});
  add('targetMuscleMass','Cenario de massa muscular alvo','kg','scenarios',boneMethod ? [boneMethod] : [],v => boneMethod ? input.targets.muscleBoneRatio!*v[boneMethod] : null,{block:pairBlock ?? goalBlock(input.targets.muscleBoneRatio),extra:{muscleMethod,boneMethod,targetRatio:input.targets.muscleBoneRatio},review:'Cenario assume massa ossea constante e mesmo par de metodos'});
  add('muscleMassChange','Cenario de variacao muscular','kg','scenarios',muscleMethod ? ['targetMuscleMass',muscleMethod] : ['targetMuscleMass'],v => muscleMethod ? v.targetMuscleMass-v[muscleMethod] : null,{block:pairBlock,allowNegative:true,allowZero:true,extra:{muscleMethod,boneMethod}});
  add('targetMassByBmi','Cenario de massa por IMC alvo','kg','scenarios',['height'],v => input.targets.bmi!*(v.height/100)**2,{block:goalBlock(input.targets.bmi),extra:{bmiTarget:input.targets.bmi},review:'Cenario algebrico definido pelo profissional; nao peso ideal'});
  return deepFreeze({version:2,engineVersion:ENGINE_VERSION,catalogVersion:CATALOG_VERSION,calculatedAt:context.date,
    context:{...context},age,collection:{protocol:input.collectionProtocol,manualEdition:input.manualEdition},measurements,results:rows,phantom,
    somatotype:{endomorphy:endo.value,mesomorphy:meso.value,ectomorphy:ecto.value,x:x.value,y:y.value,classification,status:somatoStatus,reason:unique([endo.reason,meso.reason,ecto.reason].filter(Boolean)).join('; ')},
    methodMeta:structuredClone([...METHODS]),references:structuredClone([...REFERENCES])});
}
