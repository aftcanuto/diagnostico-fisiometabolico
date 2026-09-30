/** Low-level equations use named, canonical-unit inputs. Applicability is enforced by engine.ts. */
export const correctedGirth = (girthCm:number,skinfoldMm:number) => girthCm-Math.PI*skinfoldMm/10;
export const somatotypeGirth = (girthCm:number,skinfoldMm:number) => girthCm-skinfoldMm/10;
export function martinMuscle(p:{height:number;thigh:number;forearm:number;calf:number}):number {
  return (p.height*(.0553*p.thigh**2+.0987*p.forearm**2+.0331*p.calf**2)-2445)/1000;
}
export function leeMuscle(p:{height:number;arm:number;thigh:number;calf:number;age:number;sex:'M'|'F';category:number}):number {
  return p.height/100*(.00744*p.arm**2+.00088*p.thigh**2+.00441*p.calf**2)+(p.sex === 'M'?2.4:0)-.048*p.age+p.category+7.8;
}
export function kerrComponent(p:{height:number;sum:number;component:'muscle'|'adipose'}):number {
  const scale = 170.18/p.height;
  const z = p.component === 'muscle' ? (p.sum*scale-207.21)/13.74 : (p.sum*scale-116.41)/34.79;
  return p.component === 'muscle' ? (24.5+5.4*z)/scale**3 : (25.6+5.85*z)/scale**3;
}
export function martinBone(p:{height:number;humerus:number;femur:number;wrist:number;bimalleolar:number}):number {
  return .6*p.height*(p.humerus+p.femur+p.wrist+p.bimalleolar)**2*.0001;
}
export function rochaBone(p:{height:number;wrist:number;femur:number}):number {
  return 3.02*((p.height/100)**2*(p.wrist/100)*(p.femur/100)*400)**.712;
}
export function ectomorphy(hwr:number):number {
  return hwr >= 40.75 ? .732*hwr-28.58 : hwr > 38.25 ? .463*hwr-17.63 : .1;
}
export function classifySomatotype(endo:number,meso:number,ecto:number):string {
  const values = [endo,meso,ecto];
  if (Math.max(...values)-Math.min(...values) <= 1) return 'Central';
  const ranked = values.map((value,index) => ({value,index})).sort((a,b) => b.value-a.value);
  if (ranked[0].value-ranked[1].value <= .5) {
    const pair = [ranked[0].index,ranked[1].index].sort().join('');
    return pair === '01' ? 'Mesomorfo-endomorfo' : pair === '12' ? 'Mesomorfo-ectomorfo' : 'Endomorfo-ectomorfo';
  }
  return ['Endomorfo','Mesomorfo','Ectomorfo'][ranked[0].index];
}
export function phantomZ(p:{value:number;height:number;mean:number;sd:number;dimension:1|2|3}):number|null {
  if (![p.value,p.height,p.mean,p.sd].every(Number.isFinite) || p.height <= 0 || p.sd <= 0) return null;
  const result = (p.value*(170.18/p.height)**p.dimension-p.mean)/p.sd;
  return Number.isFinite(result) ? result : null;
}
export function mirwaldOffset(p:{height:number;sittingHeight:number;mass:number;age:number;sex:'M'|'F'}):number {
  const leg = p.height-p.sittingHeight, ratio = 100*p.mass/p.height;
  return p.sex === 'M'
    ? -9.236+.0002708*leg*p.sittingHeight-.001663*p.age*leg+.007216*p.age*p.sittingHeight+.02292*ratio
    : -9.376+.0001882*leg*p.sittingHeight+.0022*p.age*leg+.005841*p.age*p.sittingHeight-.002658*p.age*p.mass+.07693*ratio;
}
// These density kernels are intentionally NOT exported by the public index.
// No input in the strict26 schema supplies their protocol-specific suprailiac site.
export function petroskiDensity(p:{sum4:number;age:number;sex:'M'|'F';mass:number;height:number}):number {
  return p.sex === 'M'
    ? 1.10726863-.00081201*p.sum4+.00000212*p.sum4**2-.00041761*p.age
    : 1.02902361-.00067159*p.sum4+.00000242*p.sum4**2-.00026073*p.age-.00056009*p.mass+.00054649*p.height;
}
export function jacksonDensity(p:{sum3:number;age:number}):number {
  return 1.0994921-.0009929*p.sum3+.0000023*p.sum3**2-.0001392*p.age;
}
export function siriFatPercent(density:number):number|null {
  if (!Number.isFinite(density) || density <= 0) return null;
  const percent = 495/density-450;
  return Number.isFinite(percent) && percent >= 0 && percent <= 100 ? percent : null;
}
