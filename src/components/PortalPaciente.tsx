'use client';
import { useMemo, useState } from 'react';
import { consolidarHistorico, type AvaliacaoHidratada } from '@/lib/historico';
import { calcIdade } from '@/lib/calculations/antropometria';
import { LineChart } from '@/components/ui/LineChart';
import { ScoresBarEvol } from '@/components/ui/ScoresBarEvol';
import { ZonasChart } from '@/components/ui/ZonasChart';
import { SilhuetaCircunferencias } from '@/components/ui/SilhuetaCircunferencias';
import { Camera, ChevronDown, PlayCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { scoreFlexibilidade } from '@/lib/calculations/flexibilidade';
import { scoreCardio, scoreComposicaoCorporal, scoreForca, scoreGlobal, scorePostura } from '@/lib/scores';

interface Props {
  paciente: { nome:string; sexo:'M'|'F'; data_nascimento:string; cpf?:string|null };
  avaliador?: { nome:string; conselho?:string|null }|null;
  avaliacoes: AvaliacaoHidratada[];
}

/* ── helpers ── */
function zCor(v:number|null){if(v==null)return'#94a3b8';if(v<=40)return'#ef4444';if(v<=70)return'#f59e0b';return'#10b981';}
function zLabel(v:number|null){if(v==null)return'N/A';if(v<=40)return'Crítico';if(v<=70)return'Atenção';return'Ótimo';}
function dlt(a:any,b:any){const x=Number(a),y=Number(b);if(!isFinite(x)||!isFinite(y)||a==null||b==null)return null;return+(x-y).toFixed(1);}

/* ── Velocímetro HDR ── */
function Gauge({value,label,size=150}:{value:number|null;label:string;size?:number}) {
  const v=Math.max(0,Math.min(100,value??0));
  const r=size*0.36, cxg=size/2, cy=size*0.52;
  const sw=size*0.10;
  function pt(deg:number,dist:number){
    return {x:cxg+dist*Math.cos(deg*Math.PI/180), y:cy+dist*Math.sin(deg*Math.PI/180)};
  }
  function arc(s:number,e:number){
    const a0=-180+(s/100)*180, a1=-180+(e/100)*180;
    const p0=pt(a0,r), p1=pt(a1,r);
    return `M${p0.x} ${p0.y} A${r} ${r} 0 ${(a1-a0)>180?1:0} 1 ${p1.x} ${p1.y}`;
  }
  // Ponteiro
  const pAngle=-180+(v/100)*180;
  const tip=pt(pAngle,r-sw/2-3);
  const cor=value==null?'#475569':v<=40?'#ef4444':v<=70?'#f59e0b':'#10b981';

  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center'}}>
      <svg width={size} height={size*0.65} viewBox={`-${size*0.15} -${size*0.04} ${size*1.3} ${size*0.65}`}>
        {/* Trilho base */}
        <path d={arc(0,100)} fill="none" stroke="#e2e8f0" strokeWidth={sw+2} strokeLinecap="round"/>
        {/* Faixas coloridas vibrantes HDR */}
        <path d={arc(0,40)}  fill="none" stroke="#ff2d2d" strokeWidth={sw} strokeLinecap="butt"/>
        <path d={arc(40,70)} fill="none" stroke="#ff9500" strokeWidth={sw} strokeLinecap="butt"/>
        <path d={arc(70,100)}fill="none" stroke="#00c853" strokeWidth={sw} strokeLinecap="butt"/>
        {/* Ticks */}
        {[0,25,50,75,100].map(t=>{
          const a=-180+(t/100)*180;
          const i=pt(a,r+sw/2+2), o=pt(a,r+sw/2+8), l=pt(a,r+sw/2+15);
          return <g key={t}>
            <line x1={i.x} y1={i.y} x2={o.x} y2={o.y} stroke="#cbd5e1" strokeWidth="1.5"/>
            <text x={l.x} y={l.y} textAnchor="middle" dominantBaseline="middle"
              fontSize="9" fill="#94a3b8" fontFamily="Inter,system-ui">{t}</text>
          </g>;
        })}
        {/* Ponteiro — agulha com forma de triângulo estreito */}
        <defs>
          <filter id="ptrShadow">
            <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#000" floodOpacity="0.3"/>
          </filter>
        </defs>
        {/* Sombra do ponteiro */}
        <line x1={cxg} y1={cy} x2={tip.x} y2={tip.y}
          stroke="rgba(0,0,0,0.15)" strokeWidth="5" strokeLinecap="round"/>
        {/* Haste do ponteiro */}
        <line x1={cxg} y1={cy} x2={tip.x} y2={tip.y}
          stroke="#334155" strokeWidth="2" strokeLinecap="round"/>
        {/* Ponta afilada */}
        {(() => {
          const angle = (pAngle * Math.PI) / 180;
          const perpAngle = angle + Math.PI / 2;
          const tipLen = r - sw/2 - 3;
          const baseW = 4;
          const bx1 = cxg + baseW * Math.cos(perpAngle);
          const by1 = cy  + baseW * Math.sin(perpAngle);
          const bx2 = cxg - baseW * Math.cos(perpAngle);
          const by2 = cy  - baseW * Math.sin(perpAngle);
          const tx2 = cxg + tipLen * Math.cos(angle);
          const ty2 = cy  + tipLen * Math.sin(angle);
          return (
            <polygon
              points={`${bx1},${by1} ${bx2},${by2} ${tx2},${ty2}`}
              fill="#1e293b"
              filter="url(#ptrShadow)"
            />
          );
        })()}
        {/* Centro — círculo duplo */}
        <circle cx={cxg} cy={cy} r="7" fill="white" stroke="#e2e8f0" strokeWidth="1.5"/>
        <circle cx={cxg} cy={cy} r="4" fill="#334155"/>
        <circle cx={cxg} cy={cy} r="1.5" fill="white"/>
        {/* Valor — negrito grande */}
        <text x={cxg} y={cy-16} textAnchor="middle"
          fontSize={size*0.22} fontWeight="900" fill={cor}
          fontFamily="Inter,system-ui" letterSpacing="-1">{value??'—'}</text>
      </svg>
      {label&&<div style={{fontSize:12,fontWeight:600,color:'#475569',marginTop:2,textAlign:'center'}}>{label}</div>}
      <span style={{fontSize:11,padding:'2px 10px',borderRadius:100,marginTop:4,
        background:`${cor}12`,color:cor,fontWeight:600,border:`1px solid ${cor}30`}}>{zLabel(value)}</span>
    </div>
  );
}

function GaugePremium({value,size=250}:{value:number|null;size?:number}) {
  const v=Math.max(0,Math.min(100,value??0));
  const cx=size/2, cy=size*0.56, r=size*0.38, sw=size*0.095;
  const cor=value==null?'#64748b':v<=40?'#ef4444':v<=70?'#f59e0b':'#10b981';
  const uid=`premium-${size}-${String(value??'na')}`;
  const pt=(deg:number,dist:number)=>({x:cx+dist*Math.cos(deg*Math.PI/180),y:cy+dist*Math.sin(deg*Math.PI/180)});
  const arc=(s:number,e:number)=>{
    const a0=-180+(s/100)*180, a1=-180+(e/100)*180;
    const p0=pt(a0,r), p1=pt(a1,r);
    return `M${p0.x} ${p0.y} A${r} ${r} 0 0 1 ${p1.x} ${p1.y}`;
  };
  const a=-180+(v/100)*180;
  const tip=pt(a,r-sw/2-5);
  const tail=pt(a+180,size*0.07);
  const perp=a*Math.PI/180+Math.PI/2;
  const bw=size*0.032;
  const b1={x:cx+bw*Math.cos(perp),y:cy+bw*Math.sin(perp)};
  const b2={x:cx-bw*Math.cos(perp),y:cy-bw*Math.sin(perp)};
  return (
    <div style={{width:'100%',display:'flex',flexDirection:'column',alignItems:'center'}}>
      <svg width="100%" height={size*0.88} viewBox={`-${size*.1} 0 ${size*1.2} ${size*.88}`}
        style={{display:'block',maxWidth:size}}>
        <defs>
          <linearGradient id={`${uid}-r`} x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#ff5b6b"/><stop offset="100%" stopColor="#ff2d2d"/></linearGradient>
          <linearGradient id={`${uid}-a`} x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#ffc247"/><stop offset="100%" stopColor="#ff8a00"/></linearGradient>
          <linearGradient id={`${uid}-g`} x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#35e49b"/><stop offset="100%" stopColor="#00b96b"/></linearGradient>
          <radialGradient id={`${uid}-hub`} cx="35%" cy="30%" r="75%"><stop offset="0%" stopColor="#ffffff"/><stop offset="55%" stopColor="#e2e8f0"/><stop offset="100%" stopColor="#94a3b8"/></radialGradient>
          <filter id={`${uid}-shadow`} x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#0f172a" floodOpacity=".16"/></filter>
          <filter id={`${uid}-ptr`} x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#0f172a" floodOpacity=".34"/></filter>
        </defs>
        <path d={arc(0,100)} fill="none" stroke="#dce5ee" strokeWidth={sw+5} strokeLinecap="round" filter={`url(#${uid}-shadow)`}/>
        <path d={arc(0,40)} fill="none" stroke={`url(#${uid}-r)`} strokeWidth={sw} strokeLinecap="butt"/>
        <path d={arc(40,70)} fill="none" stroke={`url(#${uid}-a)`} strokeWidth={sw} strokeLinecap="butt"/>
        <path d={arc(70,100)} fill="none" stroke={`url(#${uid}-g)`} strokeWidth={sw} strokeLinecap="butt"/>
        <path d={arc(0,100)} fill="none" stroke="rgba(255,255,255,.55)" strokeWidth={Math.max(3,sw*.2)} strokeLinecap="round" transform={`translate(0 ${-sw*.28})`}/>
        {[0,25,50,75,100].map(t=>{
          const da=-180+(t/100)*180;
          const i=pt(da,r+sw/2+3), o=pt(da,r+sw/2+10), l=pt(da,r+sw/2+20);
          return <g key={t}>
            <line x1={i.x} y1={i.y} x2={o.x} y2={o.y} stroke="#94a3b8" strokeWidth="1.3"/>
            <text x={l.x} y={l.y} textAnchor="middle" dominantBaseline="middle" fontSize="8.5" fill="#94a3b8" fontFamily="Inter,system-ui">{t}</text>
          </g>;
        })}
        <polygon points={`${tail.x},${tail.y} ${b1.x},${b1.y} ${tip.x},${tip.y} ${b2.x},${b2.y}`} fill="#172033" filter={`url(#${uid}-ptr)`}/>
        <circle cx={cx} cy={cy} r={size*.06} fill={`url(#${uid}-hub)`} stroke="#ffffff" strokeWidth="2"/>
        <circle cx={cx} cy={cy} r={size*.028} fill="#172033"/>
        <circle cx={cx-size*.012} cy={cy-size*.012} r={size*.01} fill="white" opacity=".9"/>
        <text x={cx} y={cy+size*.28} textAnchor="middle" fontSize={size*.22} fontWeight="900" fill={cor} fontFamily="Inter,system-ui">{value??'—'}</text>
      </svg>
      <span style={{fontSize:11,padding:'3px 12px',borderRadius:100,marginTop:-6,
        background:`${cor}12`,color:cor,fontWeight:800,border:`1px solid ${cor}30`}}>{zLabel(value)}</span>
    </div>
  );
}

/* ── Score ring ── */
function ScoreRing({value,label,size=72}:{value:number|null;label:string;size?:number}) {
  const r=size*0.36,circ=2*Math.PI*r,pct=Math.max(0,Math.min(100,value??0));
  const dash=(pct/100)*circ,cor=zCor(value);
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={size*0.09}/>
        {value!=null&&(
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={cor} strokeWidth={size*0.09}
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
            transform={`rotate(-90 ${size/2} ${size/2})`}/>
        )}
        <text x={size/2} y={size/2+2} textAnchor="middle" dominantBaseline="middle"
          fontSize={size*0.22} fontWeight="700" fill={value!=null?cor:'#cbd5e1'}
          fontFamily="Inter,system-ui">{value??'—'}</text>
      </svg>
      <span style={{fontSize:10,color:'#64748b',fontWeight:500,textAlign:'center',lineHeight:1.2}}>{label}</span>
      <span style={{fontSize:9,padding:'1px 7px',borderRadius:100,
        background:`${cor}10`,color:value!=null?cor:'#94a3b8',border:`1px solid ${cor}25`,fontWeight:600}}>
        {zLabel(value)}
      </span>
    </div>
  );
}

/* ── Gráfico de barras para scores ── */
function ScoresBarChart({series}:{series:{label:string;value:number|null;cor:string}[]}) {
  const max=100;
  return (
    <div style={{display:'flex',flexDirection:'column',gap:10}}>
      {series.map(s=>{
        const pct=s.value!=null?Math.max(0,Math.min(100,s.value)):0;
        return (
          <div key={s.label}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
              <span style={{fontSize:12,fontWeight:500,color:'#475569'}}>{s.label}</span>
              <span style={{fontSize:12,fontWeight:700,color:s.value!=null?s.cor:'#94a3b8'}}>
                {s.value??'N/A'}
              </span>
            </div>
            <div style={{background:'#f1f5f9',borderRadius:999,height:10,overflow:'hidden',
              position:'relative'}}>
              {s.value!=null&&(
                <div style={{position:'absolute',left:0,top:0,bottom:0,
                  width:`${pct}%`,background:`linear-gradient(90deg,${s.cor}aa,${s.cor})`,
                  borderRadius:999,transition:'width .5s ease'}}/>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── DeltaBadge ── */
function DeltaB({d,boa}:{d:number|null;boa:'subir'|'descer'}) {
  if(d==null||d===0)return null;
  const pos=d>0,bom=(boa==='subir'&&pos)||(boa==='descer'&&!pos);
  const c=bom?'#10b981':'#ef4444';
  const I=pos?TrendingUp:TrendingDown;
  return <span style={{display:'inline-flex',alignItems:'center',gap:3,fontSize:11,fontWeight:600,color:c}}>
    <I size={12}/>{pos?'+':''}{d}
  </span>;
}

/* ── Card / Secao / Metrica ── */
function Secao({titulo,sub,children,ordem}:{titulo:string;sub?:string;children:React.ReactNode;ordem?:number}) {
  return <section style={{marginBottom:28,order:ordem??900}}>
    <h2 style={{fontSize:17,fontWeight:700,color:'#0f172a',margin:'0 0 4px'}}>{titulo}</h2>
    {sub&&<p style={{fontSize:12,color:'#94a3b8',margin:'0 0 14px'}}>{sub}</p>}
    {!sub&&<div style={{height:12}}/>}
    {children}
  </section>;
}
function Card({children,bg,style}:{children:React.ReactNode;bg?:string;style?:React.CSSProperties}) {
  return <div style={{background:bg??'white',border:'1px solid #e2e8f0',borderRadius:14,padding:'20px 22px',...style}}>
    {children}
  </div>;
}
function Metrica({label,valor,un,cor,d,dBoa}:{label:string;valor:any;un?:string;cor?:string;d?:number|null;dBoa?:'subir'|'descer'}) {
  return <div style={{padding:'10px 12px',background:'#f8fafc',borderRadius:10,border:'1px solid #f1f5f9',overflow:'hidden',minWidth:0}}>
    <div style={{fontSize:10,color:'#94a3b8',fontWeight:500,textTransform:'uppercase',letterSpacing:'.4px',marginBottom:4,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{label}</div>
    <div style={{fontSize:17,fontWeight:700,color:cor??'#0f172a',lineHeight:1.2,wordBreak:'break-word'}}>
      {valor??'—'}{un&&<span style={{fontSize:11,fontWeight:400,color:'#94a3b8',marginLeft:3}}>{un}</span>}
    </div>
    {d!=null&&dBoa&&<div style={{marginTop:5}}><DeltaB d={d} boa={dBoa}/></div>}
  </div>;
}

function MetricaHorizontal({label,valor,un,cor,d,dBoa,nowrapValor}:{label:string;valor:any;un?:string;cor?:string;d?:number|null;dBoa?:'subir'|'descer';nowrapValor?:boolean}) {
  return <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:14,
    padding:'10px 13px',background:'#f8fafc',borderRadius:10,border:'1px solid #f1f5f9',minWidth:0}}>
    <div style={{fontSize:10,color:'#94a3b8',fontWeight:800,textTransform:'uppercase',letterSpacing:'.5px',lineHeight:1.25}}>{label}</div>
    <div style={{display:'flex',alignItems:'baseline',gap:4,minWidth:0,textAlign:'right'}}>
      <span style={{fontSize:16,fontWeight:900,color:cor??'#0f172a',lineHeight:1.15,whiteSpace:nowrapValor?'nowrap':'normal',overflowWrap:nowrapValor?'normal':'anywhere'}}>{valor??'—'}</span>
      {un&&<span style={{fontSize:10,fontWeight:500,color:'#94a3b8',whiteSpace:'nowrap'}}>{un}</span>}
      {d!=null&&dBoa&&<DeltaB d={d} boa={dBoa}/>}
    </div>
  </div>;
}

function FfmiPotencial({ffmi,massaMagra,massaOssea,peso,altura,sexo}:{ffmi:number|null; massaMagra:number|null; massaOssea:number|null; peso:number|null; altura:number|null; sexo:'M'|'F'}) {
  if(ffmi==null&&massaMagra==null)return null;
  const alturaM=altura?altura/100:null;
  const limiteFfmi=sexo==='M'?25:20.3;
  const massaMax=alturaM?+(limiteFfmi*alturaM*alturaM).toFixed(1):null;
  const pct=massaMagra!=null&&massaMax?Math.max(0,Math.min(100,+((massaMagra/massaMax)*100).toFixed(1))):null;
  return (
    <Card>
      <div style={{display:'grid',gridTemplateColumns:'minmax(170px,.7fr) minmax(260px,1.3fr)',gap:20,alignItems:'center'}}>
        <div style={{padding:'18px',borderRadius:14,background:'#f8fafc',border:'1px solid #e2e8f0'}}>
          <div style={{fontSize:10,fontWeight:900,letterSpacing:'1.2px',textTransform:'uppercase',color:'#94a3b8',marginBottom:8}}>FFMI</div>
          <div style={{fontSize:52,fontWeight:950,lineHeight:.95,letterSpacing:'-1px',color:'#10b981'}}>{ffmi??'—'}</div>
          <div style={{fontSize:12,fontWeight:700,color:'#64748b',marginTop:8}}>Índice de massa livre de gordura</div>
        </div>
        <div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:8,marginBottom:16}}>
            {massaMagra!=null&&<MetricaHorizontal label="Massa magra" valor={massaMagra} un="kg" nowrapValor/>}
            {massaOssea!=null&&<MetricaHorizontal label="Massa óssea" valor={massaOssea} un="kg" nowrapValor/>}
            {peso!=null&&<MetricaHorizontal label="Peso corporal" valor={peso} un="kg" nowrapValor/>}
            {altura!=null&&<MetricaHorizontal label="Estatura" valor={altura} un="cm" nowrapValor/>}
          </div>
          <div style={{padding:'14px 16px',borderRadius:14,background:'#f8fafc',border:'1px solid #e2e8f0'}}>
            <div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'baseline',marginBottom:10}}>
              <div>
                <div style={{fontSize:10,fontWeight:900,letterSpacing:'.7px',textTransform:'uppercase',color:'#94a3b8'}}>Potencial muscular natural</div>
                <div style={{fontSize:13,fontWeight:800,color:'#0f172a',marginTop:2}}>Massa magra atual vs limite estimado</div>
              </div>
              {pct!=null&&<div style={{fontSize:18,fontWeight:950,color:'#10b981'}}>{pct}%</div>}
            </div>
            <div style={{position:'relative',height:14,borderRadius:99,background:'#e2e8f0',overflow:'hidden'}}>
              <div style={{position:'absolute',inset:0,background:'linear-gradient(90deg,#06b6d4,#10b981,#f59e0b)',opacity:.22}}/>
              {pct!=null&&<div style={{width:`${pct}%`,height:'100%',borderRadius:99,background:'linear-gradient(90deg,#06b6d4,#10b981)',boxShadow:'0 8px 18px rgba(16,185,129,.28)'}}/>}
            </div>
            <div style={{display:'flex',justifyContent:'space-between',gap:12,marginTop:8,fontSize:11,color:'#64748b',fontWeight:700}}>
              <span>{massaMagra!=null?`${massaMagra} kg atual`:'Atual não informado'}</span>
              <span>{massaMax!=null?`${massaMax} kg limite estimado`:'Limite depende da estatura'}</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function FotoPostura({src,label}:{src?:string|null;label:string}) {
  return <div style={{background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:12,overflow:'hidden'}}>
    <div style={{height:190,display:'flex',alignItems:'center',justifyContent:'center',background:'#f1f5f9'}}>
      {src
        ?<img src={src} alt={label} style={{width:'100%',height:'100%',objectFit:'contain',display:'block'}}/>
        :<div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:8,color:'#94a3b8'}}>
          <Camera size={34}/>
          <span style={{fontSize:11,fontWeight:800,textTransform:'uppercase',letterSpacing:'.6px'}}>Foto {label}</span>
        </div>}
    </div>
    <div style={{padding:'8px 10px',fontSize:11,fontWeight:800,color:'#334155',textAlign:'center'}}>{label}</div>
  </div>;
}

function fmtValor(v:any){
  if(v==null||v==='')return null;
  if(typeof v==='boolean')return v?'Sim':'Não';
  if(Array.isArray(v))return v.filter(Boolean).join(', ');
  if(typeof v==='object')return null;
  return String(v);
}
function humanLabel(k:string){
  return k.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
}

function AnguloGauge({ label, v, comentario }: { label: string; v: any; comentario?: string }) {
  const c = v?.classificacao === 'ideal' ? '#10b981' : v?.classificacao === 'atencao' ? '#f59e0b' : '#ef4444';
  const scaleMin = Math.min(0, v?.ideal_min ?? 0, v?.valor ?? 0);
  const scaleMax = Math.max(180, v?.ideal_max ?? 180, v?.valor ?? 0);
  const span = Math.max(1, scaleMax - scaleMin);
  const valPct = Math.max(0, Math.min(100, (((v?.valor ?? 0) - scaleMin) / span) * 100));
  const i0 = Math.max(0, Math.min(100, (((v?.ideal_min ?? 0) - scaleMin) / span) * 100));
  const i1 = Math.max(0, Math.min(100, (((v?.ideal_max ?? 0) - scaleMin) / span) * 100));
  const idealW = Math.max(4, i1 - i0);
  const status = v?.classificacao === 'ideal' ? 'Dentro do ideal' : v?.classificacao === 'atencao' ? 'Atenção' : 'Fora do ideal';
  return <div style={{ background:'white', border:'1px solid #e2e8f0', borderRadius:12, padding:'12px 14px', minHeight:128, overflow:'hidden' }}>
    <div style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) auto',gap:12,alignItems:'flex-start',marginBottom:12}}>
      <div style={{fontSize:12,fontWeight:900,color:'#334155',lineHeight:1.25,wordBreak:'break-word'}}>{label}</div>
      <div style={{textAlign:'right',flexShrink:0}}>
        <div style={{fontSize:16,fontWeight:900,color:c,lineHeight:1}}>{v?.valor}°</div>
        <div style={{fontSize:8,fontWeight:900,color:c,textTransform:'uppercase',letterSpacing:.3,marginTop:3,maxWidth:84,whiteSpace:'normal'}}>{status}</div>
      </div>
    </div>
    <div style={{position:'relative',height:20,background:'#edf2f7',borderRadius:999,boxShadow:'inset 0 1px 2px #0f172a18'}}>
      <div style={{position:'absolute',left:`${i0}%`,width:`${idealW}%`,top:4,height:10,background:'linear-gradient(90deg,#86efac,#10b981)',borderRadius:999,boxShadow:'0 0 0 1px #10b98133'}}/>
      <div style={{position:'absolute',left:`${valPct}%`,top:'50%',transform:'translate(-50%,-50%)',width:3,height:24,background:c,borderRadius:2,boxShadow:`0 1px 5px ${c}55`}}/>
      <div style={{position:'absolute',left:`${valPct}%`,top:'50%',transform:'translate(-50%,-50%)',width:11,height:11,background:'#fff',border:`3px solid ${c}`,borderRadius:'50%'}}/>
    </div>
    <div style={{display:'flex',justifyContent:'space-between',fontSize:8,color:'#94a3b8',marginTop:5}}>
      <span>{scaleMin}°</span><span style={{color:'#059669',fontWeight:800}}>ideal {v?.ideal_min}°-{v?.ideal_max}°</span><span>{scaleMax}°</span>
    </div>
    {comentario && <div style={{marginTop:8,padding:'8px 10px',borderRadius:8,background:'#f8fafc',border:'1px solid #e2e8f0',fontSize:11,lineHeight:1.5,color:'#334155',whiteSpace:'pre-line'}}>{comentario}</div>}
  </div>;
}

/* ════════════════ COMPONENTE PRINCIPAL ════════════════ */
export function PortalPaciente({paciente,avaliador,avaliacoes}:Props) {
  const hist=useMemo(()=>consolidarHistorico(avaliacoes),[avaliacoes]);
  const [sel,setSel]=useState(hist.ultima?.id??'');
  const atual=hist.ordenadas.find(a=>a.id===sel)??hist.ultima;
  const ant=atual&&hist.ordenadas.findIndex(a=>a.id===atual.id)>0
    ?hist.ordenadas[hist.ordenadas.findIndex(a=>a.id===atual.id)-1]:null;

  if(!atual)return <div style={{textAlign:'center',padding:'60px 20px',color:'#94a3b8'}}>Nenhuma avaliação finalizada ainda.</div>;

  const scBase=atual.scores??{}, ascBase=ant?.scores??{};
  const pctG=atual.antropometria?.percentual_gordura??(atual as any).bioimpedancia?.percentual_gordura;
  const peso=atual.antropometria?.peso??(atual as any).bioimpedancia?.peso_kg;
  const mlg=atual.antropometria?.massa_magra??(atual as any).bioimpedancia?.massa_livre_gordura_kg;
  const imc=atual.antropometria?.imc??(atual as any).bioimpedancia?.imc;
  const altura=atual.antropometria?.estatura??(atual as any).bioimpedancia?.altura_cm;
  const massaOssea=atual.antropometria?.massa_ossea??(atual as any).bioimpedancia?.massa_ossea_kg;
  const ffmiRaw=atual.antropometria?.ffmi as any;
  const alturaCalculada=altura??(peso&&imc?Math.sqrt(Number(peso)/Number(imc))*100:null);
  const ffmiFallback=mlg&&alturaCalculada?+(Number(mlg)/((Number(alturaCalculada)/100)**2)).toFixed(1):null;
  const ffmiValor=typeof ffmiRaw==='number'?ffmiRaw:(ffmiRaw?.ffmiNorm??ffmiRaw?.ffmi??ffmiFallback);
  const vo2=atual.cardiorrespiratorio?.vo2max;
  const sv=atual.sinais_vitais as any;
  const anamnese=(atual as any).anamnese as any;
  const bioImp=(atual as any).bioimpedancia as any;
  const flex=atual.flexibilidade as any;
  const post=atual.posturografia as any;
  const idadePaciente=calcIdade(paciente.data_nascimento);
  const composicaoFallback=scoreComposicaoCorporal({
    pctGordura: pctG!=null?Number(pctG):null,
    imc: imc!=null?Number(imc):null,
    sexo: paciente.sexo,
  });
  const forcaFallback=atual.forca?.preensao_dir_kgf!=null&&atual.forca?.preensao_esq_kgf!=null
    ? scoreForca({
      preensaoDir:Number(atual.forca.preensao_dir_kgf),
      preensaoEsq:Number(atual.forca.preensao_esq_kgf),
      sexo:paciente.sexo,
      idade:idadePaciente,
      populacao:atual.forca.populacao_ref??'geral',
    })
    : null;
  const flexFallback=flex?.melhor_resultado!=null
    ? scoreFlexibilidade(Number(flex.melhor_resultado), paciente.sexo, idadePaciente)
    : null;
  const cardioFallback=vo2!=null
    ? scoreCardio({ vo2max:Number(vo2), sexo:paciente.sexo, idade:idadePaciente })
    : null;
  const posturaFallback=post?.alinhamentos ? scorePostura(post.alinhamentos) : null;
  const sc={
    ...scBase,
    postura: scBase.postura ?? posturaFallback,
    composicao_corporal: scBase.composicao_corporal ?? composicaoFallback,
    forca: scBase.forca ?? forcaFallback,
    flexibilidade: scBase.flexibilidade ?? flexFallback,
    cardiorrespiratorio: scBase.cardiorrespiratorio ?? cardioFallback,
  } as any;
  sc.global = scBase.global ?? scoreGlobal({
    postura: sc.postura ?? null,
    composicao_corporal: sc.composicao_corporal ?? null,
    forca: sc.forca ?? null,
    flexibilidade: sc.flexibilidade ?? null,
    cardiorrespiratorio: sc.cardiorrespiratorio ?? null,
  });
  const asc=ascBase;
  const gorCor=pctG==null?'#10b981':paciente.sexo==='M'?(pctG<=15?'#10b981':pctG<=22?'#f59e0b':'#ef4444'):(pctG<=21?'#10b981':pctG<=29?'#f59e0b':'#ef4444');

  const zonas=atual.cardiorrespiratorio?.zonas as any;
  const zonasItems=Array.isArray(zonas)
    ?zonas.map((z:any,i:number)=>({
      label:z.label??z.nome??`Z${i+1}`,
      nome:z.descricao??z.nome??['Regenerativo','Base aeróbica','Aeróbico','Limiar','VO₂máx'][i]??`Zona ${i+1}`,
      min:z.min??0,
      max:z.max??0,
      cor:['#22c55e','#10b981','#f59e0b','#f97316','#ef4444'][i]??'#10b981',
    }))
    :zonas?[
    {label:'Z1',nome:'Regenerativo', min:zonas.z1?.min??0,max:zonas.z1?.max??0,cor:'#6ee7b7'},
    {label:'Z2',nome:'Base aeróbica',min:zonas.z2?.min??0,max:zonas.z2?.max??0,cor:'#34d399'},
    {label:'Z3',nome:'Aeróbico',     min:zonas.z3?.min??0,max:zonas.z3?.max??0,cor:'#fbbf24'},
    {label:'Z4',nome:'Limiar',       min:zonas.z4?.min??0,max:zonas.z4?.max??0,cor:'#f97316'},
    {label:'Z5',nome:'VO₂máx',       min:zonas.z5?.min??0,max:zonas.z5?.max??0,cor:'#ef4444'},
  ]:[];

  // TODOS os scores — sempre exibir mesmo se null
  const allScores=[
    {label:'Postura',       v:sc.postura??null,             value:sc.postura??null,             ant:asc.postura,             cor:zCor(sc.postura??null)},
    {label:'Composição',    v:sc.composicao_corporal??null, value:sc.composicao_corporal??null, ant:asc.composicao_corporal, cor:zCor(sc.composicao_corporal??null)},
    {label:'Força',         v:sc.forca??null,               value:sc.forca??null,               ant:asc.forca,               cor:zCor(sc.forca??null)},
    {label:'Flexibilidade', v:sc.flexibilidade??null,       value:sc.flexibilidade??null,       ant:asc.flexibilidade,       cor:zCor(sc.flexibilidade??null)},
    {label:'Cardio',        v:sc.cardiorrespiratorio??null, value:sc.cardiorrespiratorio??null, ant:asc.cardiorrespiratorio, cor:zCor(sc.cardiorrespiratorio??null)},
    ...(sc.rml!=null?[{label:'RML', v:sc.rml, value:sc.rml, ant:asc.rml??null, cor:zCor(sc.rml)}]:[]),
  ];

  const circItems=atual.antropometria?.circunferencias
    ?Object.entries(atual.antropometria.circunferencias).filter(([,v])=>v!=null):[];

  const corFlex=flex?.classificacao==='Excelente'?'#16a34a':flex?.classificacao==='Bom'?'#10b981'
    :flex?.classificacao==='Médio'?'#f59e0b':flex?.classificacao==='Regular'?'#f97316':'#ef4444';
  const anamneseItems=anamnese
    ?Object.entries(anamnese).map(([k,v])=>({label:humanLabel(k),valor:fmtValor(v)})).filter(i=>i.valor)
    :[];
  const anamneseTopLabels=['Objetivo','Queixa Principal','Historico Lesoes','Histórico Lesões'];
  const anamneseTop=anamneseItems.filter(i=>anamneseTopLabels.includes(i.label));
  const anamneseRest=anamneseItems.filter(i=>!anamneseTopLabels.includes(i.label));
  const segs=[
    {k:'braco_dir',l:'Braço direito'},
    {k:'braco_esq',l:'Braço esquerdo'},
    {k:'tronco',l:'Tronco'},
    {k:'perna_dir',l:'Perna direita'},
    {k:'perna_esq',l:'Perna esquerda'},
  ];
  const circ=atual.antropometria?.circunferencias??{};
  const firstCircKey=(keys:string[])=>keys.find(k=>circ[k]!=null&&circ[k]!==0);
  const hasAnyCirc=(keys:string[])=>keys.some(k=>circ[k]!=null&&circ[k]!==0);
  const circRows=[
    {keys:['pescoco'],label:'Pescoço'},
    {keys:['ombro'],label:'Ombro'},
    {keys:['torax'],label:'Tórax'},
    {keys:['braco_dir_relaxado'],label:'Braço direito relaxado'},
    {keys:['braco_esq_relaxado'],label:'Braço esquerdo relaxado'},
    {keys:['braco_relaxado'],label:'Braço relaxado',skip:hasAnyCirc(['braco_dir_relaxado','braco_esq_relaxado'])},
    {keys:['braco_dir_contraido'],label:'Braço direito contraído'},
    {keys:['braco_esq_contraido'],label:'Braço esquerdo contraído'},
    {keys:['braco_contraido'],label:'Braço contraído',skip:hasAnyCirc(['braco_dir_contraido','braco_esq_contraido'])},
    {keys:['antebraco_dir'],label:'Antebraço direito'},
    {keys:['antebraco_esq'],label:'Antebraço esquerdo'},
    {keys:['antebraco'],label:'Antebraço',skip:hasAnyCirc(['antebraco_dir','antebraco_esq'])},
    {keys:['cintura'],label:'Cintura'},
    {keys:['abdome'],label:'Abdome'},
    {keys:['quadril'],label:'Quadril'},
    {keys:['coxa_dir_proximal'],label:'Coxa direita proximal'},
    {keys:['coxa_esq_proximal'],label:'Coxa esquerda proximal'},
    {keys:['coxa_proximal'],label:'Coxa proximal',skip:hasAnyCirc(['coxa_dir_proximal','coxa_esq_proximal'])},
    {keys:['coxa_dir_medial'],label:'Coxa direita medial'},
    {keys:['coxa_esq_medial'],label:'Coxa esquerda medial'},
    {keys:['coxa_medial'],label:'Coxa medial',skip:hasAnyCirc(['coxa_dir_medial','coxa_esq_medial'])},
    {keys:['panturrilha_dir'],label:'Panturrilha direita'},
    {keys:['panturrilha_esq'],label:'Panturrilha esquerda'},
    {keys:['panturrilha'],label:'Panturrilha',skip:hasAnyCirc(['panturrilha_dir','panturrilha_esq'])},
  ];
  const circDisplayItems=circRows
    .filter(r=>!r.skip)
    .map(r=>{const k=firstCircKey(r.keys);return k?[k,r.label] as [string,string]:null;})
    .filter(Boolean) as [string,string][];
  const diam=atual.antropometria?.diametros_osseos??(atual.antropometria as any)?.diametros??{};
  const diamRows=[
    {keys:['biacromial'],label:'Biacromial'},
    {keys:['torax_transverso','torax_transversal'],label:'Tórax transverso'},
    {keys:['torax_anteroposterior','torax_ap'],label:'Tórax anteroposterior'},
    {keys:['biiliocristal','bi_iliocristal'],label:'Biiliocristal'},
    {keys:['umero_biepicondiliano','biepicondiliano_umero','cotovelo'],label:'Úmero biepicondiliano'},
    {keys:['femur_biepicondiliano','biepicondiliano_femur','joelho'],label:'Fêmur biepicondiliano'},
    {keys:['punho','estiloide'],label:'Punho'},
    {keys:['tornozelo','maleolar'],label:'Tornozelo'},
  ];
  const diamDisplayItems=diamRows
    .map(r=>{const k=r.keys.find(key=>diam[key]!=null&&diam[key]!==0);return k?[k,r.label] as [string,string]:null;})
    .filter(Boolean) as [string,string][];

  return (
    <div style={{maxWidth:900,margin:'0 auto',fontFamily:'Inter,system-ui,sans-serif',display:'flex',flexDirection:'column'}}>

      {/* 1. CABEÇALHO */}
      <div style={{background:'linear-gradient(135deg,#052e16,#065f46)',borderRadius:18,
        padding:'24px 28px',marginBottom:24,color:'white'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:14}}>
          <div style={{display:'flex',alignItems:'center',gap:14}}>
            <div style={{width:48,height:48,borderRadius:'50%',background:'rgba(255,255,255,.15)',
              border:'2px solid rgba(255,255,255,.3)',display:'flex',alignItems:'center',
              justifyContent:'center',fontSize:20,fontWeight:700,flexShrink:0}}>
              {paciente.nome.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 style={{margin:0,fontSize:20,fontWeight:700}}>{paciente.nome}</h1>
              <p style={{margin:'3px 0 0',fontSize:12,color:'rgba(255,255,255,.6)'}}>
                {paciente.sexo==='M'?'Masculino':'Feminino'} · {calcIdade(paciente.data_nascimento)} anos
                {avaliador&&<> · <b style={{color:'rgba(255,255,255,.85)'}}>{avaliador.nome}</b></>}
              </p>
            </div>
          </div>
          {hist.ordenadas.length>1&&(
            <div style={{position:'relative'}}>
              <select value={sel} onChange={e=>setSel(e.target.value)}
                style={{appearance:'none',background:'rgba(255,255,255,.12)',border:'1px solid rgba(255,255,255,.25)',
                  borderRadius:8,color:'white',fontSize:12,padding:'7px 32px 7px 12px',cursor:'pointer',outline:'none'}}>
                {hist.ordenadas.slice().reverse().map(a=>(
                  <option key={a.id} value={a.id} style={{background:'#065f46'}}>
                    {new Date(a.data).toLocaleDateString('pt-BR')} · {a.tipo}
                  </option>
                ))}
              </select>
              <ChevronDown size={13} style={{position:'absolute',right:8,top:'50%',
                transform:'translateY(-50%)',color:'rgba(255,255,255,.5)',pointerEvents:'none'}}/>
            </div>
          )}
        </div>
        <div style={{marginTop:14,paddingTop:12,borderTop:'1px solid rgba(255,255,255,.1)',
          fontSize:11,color:'rgba(255,255,255,.45)'}}>
          Avaliação: {new Date(atual.data).toLocaleDateString('pt-BR',{dateStyle:'long'})}
          {ant&&<span> · Comparando com {new Date(ant.data).toLocaleDateString('pt-BR')}</span>}
        </div>
      </div>

      {/* 2. RESULTADO GERAL */}
      <Secao ordem={10} titulo="Seu resultado geral" sub="Score de 0 a 100 — todos os testes disponíveis">
        {/* Painel premium claro com card global em destaque */}
        <div style={{background:'linear-gradient(180deg,#ffffff,#f8fafc)',borderRadius:24,padding:18,
          border:'1px solid #dbe7e2',boxShadow:'0 24px 60px rgba(15,23,42,0.10)'}}>

          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(250px,1fr))',gap:16,alignItems:'start'}}>
            {/* Score global */}
            <div style={{position:'relative',overflow:'hidden',borderRadius:18,padding:20,
              background:'linear-gradient(180deg,#ffffff,#f8fafc)',color:'#0f172a',
              border:'1px solid #dbeafe',boxShadow:'0 18px 42px rgba(15,23,42,.10), inset 0 1px 0 rgba(255,255,255,.9)'}}>
              <div style={{display:'flex',flexDirection:'column',alignItems:'center'}}>
                <div style={{fontSize:10,fontWeight:900,textTransform:'uppercase',letterSpacing:1.4,color:'#64748b',marginBottom:2}}>Score global</div>
                <div style={{background:'linear-gradient(180deg,#fff,#f8fafc)',borderRadius:16,padding:'8px 8px 10px',width:'100%',
                  border:'1px solid #edf2f7',boxShadow:'inset 0 1px 0 rgba(255,255,255,.8), 0 12px 28px rgba(15,23,42,.08)'}}>
                  <GaugePremium value={sc.global??null} size={260}/>
                </div>
                {ant&&sc.global!=null&&asc.global!=null&&(
                  <div style={{marginTop:12,fontSize:11,color:'#64748b',display:'flex',alignItems:'center',gap:8}}>
                    <span>Anterior {asc.global}</span><DeltaB d={dlt(sc.global,asc.global)} boa="subir"/>
                  </div>
                )}
              </div>
            </div>

            {/* Capacidades */}
            <div style={{display:'grid',gridTemplateColumns:'1fr',gap:10}}>
              {allScores.map(s=>{
                const cor=zCor(s.v);
                const hasVal=s.v!=null;
                const pct=Math.max(0,Math.min(100,s.v??0));
                return (
                  <div key={s.label} style={{
                    background:'rgba(255,255,255,.88)',border:`1px solid ${hasVal?cor+'35':'#e2e8f0'}`,
                    borderRadius:14,padding:'12px 14px',
                    boxShadow:'0 10px 24px rgba(15,23,42,.045)',
                  }}>
                    <div style={{display:'grid',gridTemplateColumns:'90px minmax(80px,1fr) auto',alignItems:'center',gap:10}}>
                      <div style={{minWidth:0}}>
                        <div style={{fontSize:12,fontWeight:900,color:'#0f172a',letterSpacing:.2}}>{s.label}</div>
                        <div style={{fontSize:9,fontWeight:900,color:hasVal?cor:'#94a3b8',textTransform:'uppercase',letterSpacing:.7,marginTop:3}}>
                          {s.v==null?'N/A':zLabel(s.v)}
                        </div>
                      </div>
                      <div>
                        <div style={{height:9,borderRadius:999,background:'#e8eef3',overflow:'hidden',boxShadow:'inset 0 1px 2px rgba(15,23,42,.08)'}}>
                          <div style={{height:'100%',width:`${pct}%`,borderRadius:999,background:`linear-gradient(90deg,${cor}99,${cor})`}} />
                        </div>
                        {ant&&s.v!=null&&s.ant!=null&&(
                          <div style={{marginTop:7,fontSize:10,color:'#64748b',display:'flex',gap:10,alignItems:'center'}}>
                            <span>Anterior {s.ant}</span><DeltaB d={dlt(s.v,s.ant)} boa="subir"/>
                          </div>
                        )}
                      </div>
                      <div style={{fontSize:24,fontWeight:900,color:hasVal?cor:'#94a3b8',lineHeight:1,textAlign:'right'}}>
                        {hasVal?s.v:'—'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legenda */}
          <div style={{display:'flex',gap:10,marginTop:16,paddingTop:14,
            borderTop:'1px solid #e8eef3',justifyContent:'center',flexWrap:'wrap'}}>
            {[['#ef4444','Crítico 0-40'],['#f59e0b','Atenção 41-70'],['#10b981','Ótimo 71-100']].map(([c,l])=>(
              <div key={l} style={{display:'flex',alignItems:'center',gap:7,fontSize:11,color:'#64748b',fontWeight:700,
                padding:'5px 10px',border:'1px solid #e2e8f0',borderRadius:999,background:'#fff'}}>
                <div style={{width:8,height:8,borderRadius:'50%',background:c,flexShrink:0}}/>{l}
              </div>
            ))}
          </div>
        </div>
      </Secao>

      {/* 2b. ANAMNESE E SINAIS */}
      {(anamneseItems.length>0||sv)&&(
        <Secao ordem={20} titulo="Anamnese e sinais vitais" sub="Resumo dos dados clínicos preenchidos na avaliação">
          {anamneseItems.length>0&&(
            <Card style={{marginBottom:14}}>
              <h3 style={{fontSize:13,fontWeight:700,color:'#0f172a',margin:'0 0 12px'}}>Anamnese</h3>
              <div style={{display:'grid',gridTemplateColumns:'1fr',gap:9}}>
                {anamneseTop.map((i)=>(
                  <MetricaHorizontal key={i.label} label={i.label} valor={i.valor}/>
                ))}
              </div>
              {anamneseRest.length>0&&(
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:8,marginTop:10}}>
                  {anamneseRest.map((i)=>(
                    <MetricaHorizontal key={i.label} label={i.label} valor={i.valor}/>
                  ))}
                </div>
              )}
              {anamneseFull.length>0&&(
                <div style={{display:'grid',gridTemplateColumns:'1fr',gap:8,marginTop:10}}>
                  {anamneseFull.map((i)=>(
                    <MetricaHorizontal key={i.label} label={i.label} valor={i.valor}/>
                  ))}
                </div>
              )}
            </Card>
          )}
          {sv&&(
            <Card>
              <h3 style={{fontSize:13,fontWeight:700,color:'#0f172a',margin:'0 0 12px'}}>Sinais vitais</h3>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))',gap:8}}>
                {sv?.pa_sistolica&&sv?.pa_diastolica&&<MetricaHorizontal label="Pressão arterial" valor={`${sv.pa_sistolica}/${sv.pa_diastolica}`} un="mmHg"/>}
                {sv?.fc_repouso&&<MetricaHorizontal label="FC repouso" valor={sv.fc_repouso} un="bpm"/>}
                {sv?.spo2&&<MetricaHorizontal label="SpO₂" valor={`${sv.spo2}%`}/>}
                {sv?.temperatura&&<MetricaHorizontal label="Temperatura" valor={sv.temperatura} un="°C"/>}
                {sv?.fr&&<MetricaHorizontal label="Frequência respiratória" valor={sv.fr} un="irpm"/>}
              </div>
            </Card>
          )}
        </Secao>
      )}

      {/* 3. COMPOSIÇÃO CORPORAL */}
      {(pctG!=null||peso!=null)&&(
        <Secao ordem={40} titulo="Dados corporais" sub="Composição corporal, circunferências e medidas segmentadas">
          <Card style={{overflowX:'auto'}}>
            <div style={{minWidth:620}}>
              <SilhuetaCircunferencias
                sexo={paciente.sexo}
                dados={{
                  peso: peso??undefined,
                  altura: altura??undefined,
                  imc: imc??undefined,
                  percentual_gordura: pctG??undefined,
                  massa_magra: mlg??undefined,
                  massa_ossea: massaOssea??undefined,
                  massa_muscular: (atual as any).bioimpedancia?.massa_muscular_kg??undefined,
                  agua_corporal: (atual as any).bioimpedancia?.agua_corporal_pct
                    ?? (atual as any).bioimpedancia?.agua_corporal
                    ?? undefined,
                  metabolismo_basal: (atual as any).bioimpedancia?.taxa_metabolica_basal_kcal
                    ?? (atual as any).bioimpedancia?.metabolismo_basal
                    ?? undefined,
                  gordura_visceral: (atual as any).bioimpedancia?.gordura_visceral
                    ?? undefined,
                  rcq: atual.antropometria?.rcq??undefined,
                  somatotipo: atual.antropometria?.somatotipo??null,
                  ffmi: null,
                  segmentar_gordura: null,
                }}
                circunferencias={{}}
                pctGorduraTotal={pctG??null}
                modo="claro"
                deltaMap={{
                  peso: dlt(peso, ant?.antropometria?.peso??(ant as any)?.bioimpedancia?.peso_kg),
                  imc:  dlt(imc,  ant?.antropometria?.imc??(ant as any)?.bioimpedancia?.imc),
                  pctGordura: dlt(pctG, ant?.antropometria?.percentual_gordura??(ant as any)?.bioimpedancia?.percentual_gordura),
                  massaMagra: dlt(mlg,  ant?.antropometria?.massa_magra??(ant as any)?.bioimpedancia?.massa_livre_gordura_kg),
                }}
              />
            </div>
          </Card>
        </Secao>
      )}

      {(ffmiValor!=null||mlg!=null)&&(
        <Secao ordem={50} titulo="FFMI e potencial muscular" sub="Índice de massa livre de gordura e limite natural estimado">
          <FfmiPotencial
            ffmi={ffmiValor??null}
            massaMagra={mlg??null}
            massaOssea={massaOssea??null}
            peso={peso??null}
            altura={alturaCalculada??null}
            sexo={paciente.sexo}
          />
        </Secao>
      )}

      {circDisplayItems.length>0&&(
        <Secao ordem={52} titulo="Circunferências corporais" sub="Medidas organizadas de cima para baixo no corpo">
          <Card>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:8}}>
              {circDisplayItems.map(([k,l])=>(
                <MetricaHorizontal key={k} label={l} valor={circ[k]} un="cm"/>
              ))}
            </div>
          </Card>
        </Secao>
      )}

      {diamDisplayItems.length>0&&(
        <Secao ordem={53} titulo="Diâmetros ósseos" sub="Medidas antropométricas de referência ISAK">
          <Card>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:8}}>
              {diamDisplayItems.map(([k,l])=>(
                <MetricaHorizontal key={k} label={l} valor={diam[k]} un="cm"/>
              ))}
            </div>
          </Card>
        </Secao>
      )}

      {/* 3b. BIOIMPEDÂNCIA DETALHADA */}
      {bioImp&&(
        <Secao ordem={45} titulo="Bioimpedância detalhada" sub="Dados metabólicos e composição segmentar">
          <Card style={{marginBottom:14}}>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(118px,1fr))',gap:8}}>
              {bioImp.aparelho&&<Metrica label="Aparelho" valor={bioImp.aparelho}/>}
              {bioImp.agua_corporal_kg!=null&&<Metrica label="Água corporal" valor={bioImp.agua_corporal_kg} un="kg" cor="#0ea5e9"/>}
              {bioImp.agua_corporal_pct!=null&&<Metrica label="Água corporal" valor={bioImp.agua_corporal_pct} un="%" cor="#0ea5e9"/>}
              {bioImp.taxa_metabolica_basal_kcal!=null&&<Metrica label="TMB" valor={bioImp.taxa_metabolica_basal_kcal} un="kcal"/>}
              {(bioImp.gordura_visceral_nivel??bioImp.gordura_visceral)!=null&&<Metrica label="Gordura visceral" valor={bioImp.gordura_visceral_nivel??bioImp.gordura_visceral}/>}
              {bioImp.idade_metabolica!=null&&<Metrica label="Idade metabólica" valor={bioImp.idade_metabolica} un="anos"/>}
              {bioImp.indice_apendicular!=null&&<Metrica label="Índice apendicular" valor={bioImp.indice_apendicular}/>}
              {bioImp.massa_muscular_kg!=null&&<Metrica label="Massa muscular" valor={bioImp.massa_muscular_kg} un="kg" cor="#10b981"/>}
            </div>
          </Card>
          {(bioImp.segmentar_magra||bioImp.segmentar_gordura)&&(
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:14}}>
              {bioImp.segmentar_magra&&(
                <Card>
                  <h3 style={{fontSize:13,fontWeight:700,color:'#0f172a',margin:'0 0 12px'}}>Massa magra por segmento</h3>
                  <div style={{display:'flex',flexDirection:'column',gap:8}}>
                    {segs.map(s=>{
                      const v=bioImp.segmentar_magra?.[s.k];
                      if(v==null)return null;
                      const kg=typeof v==='object'?v.kg:v;
                      const pct=typeof v==='object'?v.pct:null;
                      return <div key={s.k} style={{display:'grid',gridTemplateColumns:'1fr auto auto',gap:10,alignItems:'center',fontSize:12,padding:'8px 0',borderBottom:'1px solid #f1f5f9'}}>
                        <span style={{fontWeight:700,color:'#334155'}}>{s.l}</span>
                        <span style={{fontWeight:800,color:'#059669'}}>{kg} kg</span>
                        {pct!=null&&<span style={{fontSize:10,color:'#64748b',background:'#f0fdf4',borderRadius:999,padding:'2px 8px'}}>{pct}%</span>}
                      </div>;
                    })}
                  </div>
                </Card>
              )}
              {bioImp.segmentar_gordura&&(
                <Card>
                  <h3 style={{fontSize:13,fontWeight:700,color:'#0f172a',margin:'0 0 12px'}}>Gordura por segmento</h3>
                  <div style={{display:'flex',flexDirection:'column',gap:8}}>
                    {segs.map(s=>{
                      const legacyKey=s.k.replace('_dir','_d').replace('_esq','_e');
                      const v=bioImp.segmentar_gordura?.[s.k]??bioImp.segmentar_gordura?.[legacyKey];
                      if(v==null)return null;
                      const kg=typeof v==='object'?v.kg:v;
                      const pct=typeof v==='object'?v.pct:null;
                      return <div key={s.k} style={{display:'grid',gridTemplateColumns:'1fr auto auto',gap:10,alignItems:'center',fontSize:12,padding:'8px 0',borderBottom:'1px solid #f1f5f9'}}>
                        <span style={{fontWeight:700,color:'#334155'}}>{s.l}</span>
                        <span style={{fontWeight:800,color:'#f59e0b'}}>{kg} kg</span>
                        {pct!=null&&<span style={{fontSize:10,color:'#64748b',background:'#fff7ed',borderRadius:999,padding:'2px 8px'}}>{pct}%</span>}
                      </div>;
                    })}
                  </div>
                </Card>
              )}
            </div>
          )}
        </Secao>
      )}

      {/* 3c. ANTROPOMETRIA DETALHADA */}
      {(atual.antropometria?.dobras||atual.antropometria?.somatotipo)&&(
        <Secao ordem={55} titulo="Antropometria detalhada" sub="Dobras cutâneas, somatotipo e indicadores complementares">
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:14}}>
            {atual.antropometria?.dobras&&(
              <Card>
                <h3 style={{fontSize:13,fontWeight:700,color:'#0f172a',margin:'0 0 12px'}}>Dobras cutâneas</h3>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(110px,1fr))',gap:8}}>
                  {Object.entries(atual.antropometria.dobras).filter(([,v])=>v!=null).map(([k,v])=>(
                    <Metrica key={k} label={humanLabel(k)} valor={v} un="mm"/>
                  ))}
                </div>
              </Card>
            )}
            {atual.antropometria?.somatotipo&&(
              <Card>
                <h3 style={{fontSize:13,fontWeight:700,color:'#0f172a',margin:'0 0 12px'}}>Somatotipo</h3>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
                  <Metrica label="Endomorfia" valor={(atual.antropometria.somatotipo as any).endomorfia}/>
                  <Metrica label="Mesomorfia" valor={(atual.antropometria.somatotipo as any).mesomorfia}/>
                  <Metrica label="Ectomorfia" valor={(atual.antropometria.somatotipo as any).ectomorfia}/>
                </div>
              </Card>
            )}
          </div>
        </Secao>
      )}

      {/* 4. CARDIOVASCULAR */}
      {(vo2!=null||sv||zonasItems.length>0)&&(
        <Secao ordem={90} titulo="Saúde cardiovascular" sub="Capacidade aeróbica, sinais vitais e zonas de treinamento">
          {(vo2!=null||sv)&&(
            <Card style={{marginBottom:14}}>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(230px,1fr))',gap:8}}>
                {vo2!=null&&<MetricaHorizontal label="VO₂máx" valor={vo2} un="ml/kg/min" cor="#10b981"
                  d={dlt(vo2,ant?.cardiorrespiratorio?.vo2max)} dBoa="subir"/>}
                {atual.cardiorrespiratorio?.classificacao_vo2&&<MetricaHorizontal label="Classificação" valor={atual.cardiorrespiratorio.classificacao_vo2}/>}
                {atual.cardiorrespiratorio?.fc_limiar!=null&&<MetricaHorizontal label="FC limiar" valor={atual.cardiorrespiratorio.fc_limiar} un="bpm" cor="#f59e0b"/>}
                {atual.cardiorrespiratorio?.fc_max!=null&&<MetricaHorizontal label="FC máxima" valor={atual.cardiorrespiratorio.fc_max} un="bpm" cor="#f87171"/>}
                {sv?.pa_sistolica&&sv?.pa_diastolica&&<MetricaHorizontal label="Pressão arterial" valor={`${sv.pa_sistolica}/${sv.pa_diastolica}`} un="mmHg"/>}
                {sv?.fc_repouso&&<MetricaHorizontal label="FC repouso" valor={sv.fc_repouso} un="bpm"/>}
                {sv?.spo2&&<MetricaHorizontal label="SpO₂" valor={`${sv.spo2}%`}/>}
              </div>
              {atual.cardiorrespiratorio?.protocolo&&(
                <div style={{marginTop:10,padding:'11px 13px',borderRadius:10,background:'#f8fafc',border:'1px solid #f1f5f9'}}>
                  <div style={{fontSize:10,color:'#94a3b8',fontWeight:800,textTransform:'uppercase',letterSpacing:'.5px',marginBottom:4}}>Protocolo</div>
                  <div style={{fontSize:14,fontWeight:800,color:'#0f172a',lineHeight:1.35}}>{atual.cardiorrespiratorio.protocolo}</div>
                </div>
              )}
            </Card>
          )}
          {zonasItems.length>0&&(
            <Card style={{background:'#f8fafc'}}>
              <h3 style={{fontSize:13,fontWeight:600,color:'#475569',margin:'0 0 2px'}}>Zonas de treinamento</h3>
              <p style={{fontSize:11,color:'#94a3b8',margin:'0 0 12px'}}>Frequência cardíaca alvo por intensidade</p>
              <ZonasChart zonas={zonasItems}/>
            </Card>
          )}
        </Secao>
      )}

      {/* 4b. CARDIO AVANÇADO */}
      {((atual.cardiorrespiratorio as any)?.rec_fc||(atual.cardiorrespiratorio as any)?.zonas_limiar?.length>0||(atual.cardiorrespiratorio as any)?.velocidades_treino?.length>0)&&(
        <Secao ordem={91} titulo="Cardiorrespiratório avançado" sub="Recuperação de frequência cardíaca, limiares e velocidades">
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:14}}>
            {(atual.cardiorrespiratorio as any)?.rec_fc&&(
              <Card>
                <h3 style={{fontSize:13,fontWeight:700,color:'#0f172a',margin:'0 0 12px'}}>Recuperação da FC</h3>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(100px,1fr))',gap:8}}>
                  {[10,30,60].map(String).filter(k=>(atual.cardiorrespiratorio as any).rec_fc[k]!=null).map((k)=>(
                    <Metrica key={k} label={`${k}s`} valor={(atual.cardiorrespiratorio as any).rec_fc[k]} un="bpm"/>
                  ))}
                </div>
              </Card>
            )}
            {(atual.cardiorrespiratorio as any)?.velocidades_treino?.length>0&&(
              <Card>
                <h3 style={{fontSize:13,fontWeight:700,color:'#0f172a',margin:'0 0 12px'}}>Velocidades de treino</h3>
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {(atual.cardiorrespiratorio as any).velocidades_treino.map((z:any,i:number)=>(
                    <div key={i} style={{display:'grid',gridTemplateColumns:'1fr auto',gap:10,alignItems:'center',fontSize:12,padding:'8px 0',borderBottom:'1px solid #f1f5f9'}}>
                      <span style={{fontWeight:700,color:'#334155'}}>{z.nome??z.zona??`Zona ${i+1}`}</span>
                      <span style={{fontWeight:800,color:'#059669'}}>{z.min??z.vel_min} - {z.max??z.vel_max} km/h</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
            {(atual.cardiorrespiratorio as any)?.zonas_limiar?.length>0&&(
              <Card>
                <h3 style={{fontSize:13,fontWeight:700,color:'#0f172a',margin:'0 0 12px'}}>Zonas por limiar</h3>
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {(atual.cardiorrespiratorio as any).zonas_limiar.map((z:any,i:number)=>(
                    <div key={i} style={{display:'grid',gridTemplateColumns:'1fr auto',gap:10,alignItems:'center',fontSize:12,padding:'8px 0',borderBottom:'1px solid #f1f5f9'}}>
                      <span style={{fontWeight:700,color:'#334155'}}>{z.nome??z.zona??`Zona ${i+1}`}</span>
                      <span style={{fontWeight:800,color:'#f59e0b'}}>{z.min??z.fc_min} - {z.max??z.fc_max} bpm</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </Secao>
      )}

      {/* 5. FORÇA */}
      {(atual.forca?.preensao_dir_kgf||atual.forca?.preensao_esq_kgf||(atual.forca as any)?.sptech_testes?.length>0||(atual.forca as any)?.tracao_testes?.length>0)&&(
        <Secao ordem={70} titulo="Força muscular" sub="Preensão palmar e dinamometria isométrica">
          {(atual.forca?.preensao_dir_kgf||atual.forca?.preensao_esq_kgf)&&(
            <Card style={{marginBottom:14}}>
              <h3 style={{fontSize:13,fontWeight:600,color:'#475569',margin:'0 0 12px'}}>Preensão palmar</h3>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(100px,1fr))',gap:8,overflow:'hidden'}}>
                {atual.forca?.preensao_dir_kgf!=null&&<Metrica label="Mão direita" valor={atual.forca.preensao_dir_kgf} un="kgf"
                  d={dlt(atual.forca.preensao_dir_kgf,ant?.forca?.preensao_dir_kgf)} dBoa="subir"/>}
                {atual.forca?.preensao_esq_kgf!=null&&<Metrica label="Mão esquerda" valor={atual.forca.preensao_esq_kgf} un="kgf"
                  d={dlt(atual.forca.preensao_esq_kgf,ant?.forca?.preensao_esq_kgf)} dBoa="subir"/>}
                {atual.forca?.assimetria_percent!=null&&<Metrica label="Assimetria" valor={`${atual.forca.assimetria_percent}%`}/>}
              </div>
            </Card>
          )}
          {(atual.forca as any)?.sptech_testes?.length>0&&(
            <Card style={{marginBottom:(atual.forca as any)?.sptech_relacoes?.length>0?14:0}}>
              <h3 style={{fontSize:13,fontWeight:600,color:'#475569',margin:'0 0 12px'}}>Dinamometria isométrica</h3>
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                {(atual.forca as any).sptech_testes.map((t:any,i:number)=>{
                  const art=t.articulacao==='Outra'?(t.nome_outra||'Outra'):t.articulacao;
                  const mov=t.articulacao==='Outra'?(t.movimento_outra||'—'):t.movimento;
                  const ax=['Coluna','Cervical','Lombar'].includes(t.articulacao);
                  const bi=t.articulacao==='Outra'?t.lateralidade==='bilateral':!ax;
                  const ca=t.classificacao_assimetria==='Leve'?'#10b981':t.classificacao_assimetria==='Moderada'?'#f59e0b':'#ef4444';
                  const LCard=({lado,tit,ac}:{lado:any;tit:string;ac:string})=>{
                    if(!lado?.kgf&&!lado?.torque_nm)return null;
                    return <div style={{flex:1,padding:'10px 12px',background:'#f8fafc',borderRadius:10,border:`1px solid ${ac}25`}}>
                      <div style={{fontSize:9,fontWeight:600,color:ac,textTransform:'uppercase',letterSpacing:'.4px',marginBottom:6}}>{tit}</div>
                      <div style={{display:'flex',gap:12,alignItems:'baseline',flexWrap:'wrap'}}>
                        {lado.kgf&&<span style={{fontSize:18,fontWeight:700,color:'#0f172a'}}>{lado.kgf}<span style={{fontSize:10,color:'#94a3b8',marginLeft:2}}>kgf</span></span>}
                        {lado.torque_nm&&<span style={{fontSize:15,fontWeight:600,color:'#475569'}}>{lado.torque_nm}<span style={{fontSize:10,color:'#94a3b8',marginLeft:2}}>Nm</span></span>}
                      </div>
                    </div>;
                  };
                  return <div key={i} style={{border:'1px solid #e2e8f0',borderRadius:10,overflow:'hidden'}}>
                    <div style={{padding:'8px 14px',background:'#fafbfc',borderBottom:'1px solid #f1f5f9',
                      display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                      <span style={{fontSize:13,fontWeight:600,color:'#0f172a'}}>{art} — {mov}</span>
                      {t.assimetria_pct&&bi&&<span style={{fontSize:10,padding:'2px 8px',borderRadius:100,fontWeight:600,
                        background:`${ca}12`,color:ca,border:`1px solid ${ca}25`}}>Assimetria {t.assimetria_pct}%</span>}
                    </div>
                    <div style={{padding:10,display:'flex',gap:8}}>
                      {bi?<><LCard lado={t.lado_d} tit="◀ Lado Direito" ac="#3b82f6"/>
                        <LCard lado={t.lado_e} tit="Lado Esquerdo ▶" ac="#8b5cf6"/></>
                        :<LCard lado={ax||t.lateralidade!=='esquerdo'?t.lado_d:t.lado_e} tit="Resultado" ac="#64748b"/>}
                    </div>
                  </div>;
                })}
              </div>
            </Card>
          )}
          {(atual.forca as any)?.tracao_testes?.length>0&&(
            <Card style={{marginBottom:(atual.forca as any)?.sptech_relacoes?.length>0?14:0}}>
              <h3 style={{fontSize:13,fontWeight:600,color:'#475569',margin:'0 0 12px'}}>Dinamometria por tração</h3>
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                {(atual.forca as any).tracao_testes.map((t:any,i:number)=>{
                  const ca=t.classificacao_assimetria==='Leve'?'#10b981':t.classificacao_assimetria==='Moderada'?'#f59e0b':'#ef4444';
                  const LCard=({lado,tit,ac}:{lado:any;tit:string;ac:string})=>{
                    if(!lado?.fim_kgf&&!lado?.rm1_kg&&!lado?.rfd_kgf_s)return null;
                    return <div style={{flex:1,padding:'10px 12px',background:'#f8fafc',borderRadius:10,border:`1px solid ${ac}25`}}>
                      <div style={{fontSize:9,fontWeight:600,color:ac,textTransform:'uppercase',letterSpacing:'.4px',marginBottom:6}}>{tit}</div>
                      <div style={{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:8}}>
                        <Metrica label="FIM" valor={lado.fim_kgf || '—'} un="kgf"/>
                        <Metrica label="1RM estimado" valor={lado.rm1_kg || '—'} un="kg"/>
                        <Metrica label="RFD" valor={lado.rfd_kgf_s || '—'} un="kgf/s"/>
                      </div>
                    </div>;
                  };
                  return <div key={i} style={{border:'1px solid #e2e8f0',borderRadius:10,overflow:'hidden'}}>
                    <div style={{padding:'8px 14px',background:'#fafbfc',borderBottom:'1px solid #f1f5f9',
                      display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                      <span style={{fontSize:13,fontWeight:600,color:'#0f172a'}}>{t.musculo || `Teste ${i+1}`}</span>
                      {t.exercicio_ref&&<span style={{fontSize:11,color:'#64748b'}}>{t.exercicio_ref}</span>}
                      {t.fator&&<span style={{fontSize:10,padding:'2px 8px',borderRadius:100,background:'#eef2ff',color:'#4338ca'}}>Fator {t.fator}</span>}
                      {t.assimetria_pct&&<span style={{fontSize:10,padding:'2px 8px',borderRadius:100,fontWeight:600,
                        background:`${ca}12`,color:ca,border:`1px solid ${ca}25`}}>Assimetria {t.assimetria_pct}%</span>}
                    </div>
                    <div style={{padding:10,display:'flex',gap:8}}>
                      <LCard lado={t.lado_d} tit="◀ Lado Direito" ac="#3b82f6"/>
                      <LCard lado={t.lado_e} tit="Lado Esquerdo ▶" ac="#8b5cf6"/>
                    </div>
                    {t.observacoes&&<div style={{padding:'0 12px 12px',fontSize:12,color:'#475569'}}>{t.observacoes}</div>}
                  </div>;
                })}
              </div>
            </Card>
          )}
          {(atual.forca as any)?.sptech_relacoes?.length>0&&(
            <Card>
              <h3 style={{fontSize:13,fontWeight:600,color:'#475569',margin:'0 0 12px'}}>Relações de força</h3>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:8}}>
                {(atual.forca as any).sptech_relacoes.map((r:any,i:number)=>(
                  <Metrica key={i} label={r.nome??r.relacao??`Relação ${i+1}`} valor={r.valor??r.percentual} un={r.unidade??'%'} cor="#8b5cf6"/>
                ))}
              </div>
            </Card>
          )}
        </Secao>
      )}

      {/* 6. FLEXIBILIDADE */}
      {flex&&(
        <Secao ordem={60} titulo="Flexibilidade" sub="Banco de Wells — Sit and Reach">
          <Card>
            <div style={{display:'flex',alignItems:'center',gap:24}}>
              <div style={{textAlign:'center',flexShrink:0}}>
                <div style={{fontSize:44,fontWeight:700,color:corFlex,lineHeight:1}}>{flex.melhor_resultado??'—'}</div>
                <div style={{fontSize:12,color:'#94a3b8',marginTop:2}}>cm</div>
                <div style={{marginTop:8,display:'inline-block',padding:'3px 14px',borderRadius:100,
                  fontSize:11,fontWeight:600,background:`${corFlex}15`,color:corFlex}}>{flex.classificacao??'—'}</div>
              </div>
              {flex.tentativa_1!=null&&(
                <div style={{flex:1,borderLeft:'1px solid #f1f5f9',paddingLeft:20,display:'flex',gap:10}}>
                  {[flex.tentativa_1,flex.tentativa_2,flex.tentativa_3].filter(Boolean).map((v:any,i:number)=>(
                    <Metrica key={i} label={`Tentativa ${i+1}`} valor={v} un="cm"/>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </Secao>
      )}

      {/* 7. POSTUROGRAFIA */}
      {post&&(()=>{
        const desv=Object.entries(post.alinhamentos??{}).filter(([,v])=>v).map(([k])=>k.replace(/_/g,' '));
        return <Secao ordem={30} titulo="Avaliação postural">
          <Card>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:10,marginBottom:14}}>
              <FotoPostura src={post.foto_anterior} label="Anterior"/>
              <FotoPostura src={post.foto_posterior} label="Posterior"/>
              <FotoPostura src={post.foto_lateral_dir} label="Lateral direita"/>
              <FotoPostura src={post.foto_lateral_esq} label="Lateral esquerda"/>
            </div>
            {desv.length===0
              ?<div style={{display:'flex',alignItems:'center',gap:8,padding:'10px 14px',
                background:'#f0fdf4',borderRadius:10,border:'1px solid #bbf7d0'}}>
                <span style={{fontSize:13,fontWeight:600,color:'#166534'}}>✓ Nenhum desvio relevante</span>
              </div>
              :<div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                {desv.map((d,i)=><span key={i} style={{fontSize:11,padding:'4px 12px',borderRadius:100,
                  background:'#fef2f2',color:'#991b1b',border:'1px solid #fecaca',
                  textTransform:'capitalize'}}>{d}</span>)}
              </div>}
          </Card>
        </Secao>;
      })()}

      {/* 7b. RML — RESISTÊNCIA MUSCULAR */}
      {(atual as any)?.rml && (() => {
        const rml = (atual as any).rml as any;
        const cat: string = rml.categoria ?? 'jovem_ativo';
        const COR: Record<string,string> = {
          'Excelente':'#10b981','Bom':'#3b82f6','Regular':'#f59e0b',
          'Fraco':'#f97316','Muito fraco':'#ef4444',
        };
        const testes = cat === 'jovem_ativo' ? [
          { lbl: rml.mmss_modalidade === 'modificada' ? 'Flexão modificada' : 'Flexão de braço', val: rml.mmss_reps, unit:'reps', cls: rml.mmss_classificacao },
          { lbl: 'Abdominal 1 min', val: rml.abd_1min_reps, unit:'reps', cls: rml.abd_1min_classificacao },
          { lbl: 'Prancha ventral',  val: rml.abd_prancha_seg, unit:'seg', cls: rml.abd_prancha_classificacao },
          { lbl: 'Agachamento 1 min',val: rml.mmii_agach_reps, unit:'reps', cls: rml.mmii_agach_classificacao },
          ...(rml.mmii_wallsit_seg != null ? [{ lbl: 'Wall sit', val: rml.mmii_wallsit_seg, unit:'seg', cls: rml.mmii_wallsit_classificacao }] : []),
        ] : [
          { lbl: 'Sentar e Levantar 30s', val: rml.idoso_sl_reps, unit:'reps', cls: rml.idoso_sl_classificacao },
          { lbl: 'Arm Curl 30s', val: rml.idoso_armcurl_reps, unit:'reps', cls: rml.idoso_armcurl_classificacao },
        ];
        const ativos = testes.filter(t => t.val != null);
        if (!ativos.length) return null;
        return (
          <Secao ordem={80} titulo="Resistência Muscular (RML)" sub={cat === 'jovem_ativo' ? 'Jovem / Ativo — testes dinâmicos e isométricos' : 'Idoso — Senior Fitness Test'}>
            <Card>
              <div style={{display:'flex', gap:12, flexWrap:'wrap', marginBottom: ativos.length ? 14 : 0}}>
                {ativos.map((t, i) => {
                  const cor = t.cls ? (COR[t.cls] ?? '#6b7280') : '#94a3b8';
                  return (
                    <div key={i} style={{flex:'1 1 120px', minWidth:0, background:'#f8fafc', borderRadius:12,
                      padding:'12px 10px', textAlign:'center', border:`1px solid ${cor}33`}}>
                      <div style={{fontSize:26, fontWeight:900, color:cor, lineHeight:1}}>{t.val}</div>
                      <div style={{fontSize:9, color:'#94a3b8', textTransform:'uppercase', letterSpacing:0.5, margin:'3px 0 5px'}}>{t.unit}</div>
                      <div style={{fontSize:10, fontWeight:600, color:'#475569', lineHeight:1.3, wordBreak:'break-word'}}>{t.lbl}</div>
                      {t.cls && (
                        <div style={{marginTop:6, display:'inline-block', padding:'2px 10px', borderRadius:100,
                          fontSize:9, fontWeight:700, background:`${cor}22`, color:cor}}>{t.cls}</div>
                      )}
                    </div>
                  );
                })}
              </div>
              {atual.analises_ia?.rml && (
                <div style={{background:'#f0fdf4',borderLeft:'3px solid #10b981',borderRadius:'0 8px 8px 0',
                  padding:'10px 14px',fontSize:11,color:'#166534',fontStyle:'italic',lineHeight:1.6}}>
                  {typeof atual.analises_ia.rml === 'string' ? atual.analises_ia.rml : atual.analises_ia.rml?.texto_editado}
                </div>
              )}
            </Card>
          </Secao>
        );
      })()}

      {/* 8. BIOMECÂNICA */}
      {(atual as any)?.biomecanica_corrida && (() => {
        const bio = (atual as any).biomecanica_corrida as any;
        const ang = bio.angulos ?? {};
        const grafs = bio.graficos ?? {};
        const comentGrafs = bio.comentarios_graficos ?? {};
        const comentAngs = bio.comentarios_angulos ?? {};
        const achados = bio.achados ?? {};
        const labels: Record<string,string> = {
          cabeca:'Cabeça', tronco:'Tronco', aterrissagem_passada:'Aterrissagem',
          joelho_frente_contato:'Joelho frente', joelho_posterior_contato:'Joelho posterior',
          bracos:'Braços', queda_pelve_esq:'Pelve esq.', queda_pelve_dir:'Pelve dir.',
          alinhamento_joelho_esq:'Joelho esq.', alinhamento_joelho_dir:'Joelho dir.',
          pronacao_supinacao_esq:'Pronação/Supinação esq.', pronacao_supinacao_dir:'Pronação/Supinação dir.',
        };
        const keys = Object.keys(labels).filter(k => ang[k]);
        const grafItems = [
          ['joelho_url','joelho','Joelho'], ['quadril_url','quadril','Quadril'], ['cotovelo_url','cotovelo','Cotovelo'],
        ].filter(([k]) => grafs[k]);
        if (!keys.length && !grafItems.length && !bio.link_video) return null;
        return (
          <Secao ordem={100} titulo="Biomecânica da corrida" sub="Cinemática 2D e ângulos articulares">
            <Card>
              {bio.link_video && (
                <a href={bio.link_video} target="_blank" rel="noopener noreferrer"
                  style={{display:'inline-flex',alignItems:'center',gap:8,padding:'10px 16px',borderRadius:999,
                    background:'linear-gradient(135deg,#064e3b,#059669)',boxShadow:'0 10px 24px rgba(5,150,105,.22)',
                    color:'white',fontSize:12,fontWeight:900,textDecoration:'none',marginBottom:14}}>
                  <PlayCircle size={16}/> Ver vídeo da cinemática
                </a>
              )}
              {keys.length > 0 && (
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))',gap:12,marginBottom:grafItems.length?16:0}}>
                  {keys.map(k => <AnguloGauge key={k} label={labels[k]} v={ang[k]} comentario={comentAngs[k]}/>)}
                </div>
              )}
              {achados.comentarios_risco && (
                <div style={{marginBottom:grafItems.length?16:0,padding:'10px 11px',borderRadius:8,background:'#fff7ed',border:'1px solid #fed7aa'}}>
                  <div style={{fontSize:9,fontWeight:800,color:'#9a3412',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:4}}>Pontos de atenção e risco</div>
                  <div style={{fontSize:12,lineHeight:1.55,color:'#7c2d12',whiteSpace:'pre-line'}}>{achados.comentarios_risco}</div>
                </div>
              )}
              {grafItems.length > 0 && (
                <div style={{paddingTop:14,borderTop:'1px solid #f1f5f9'}}>
                  <div style={{fontSize:11,fontWeight:600,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:10}}>
                    Gráficos cinemáticos
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:14}}>
                    {grafItems.map(([k,_ck,l]) => (
                      <div key={k} style={{width:'100%',minWidth:0}}>
                        <div style={{fontSize:11,color:'#0f172a',fontWeight:800,textTransform:'uppercase',letterSpacing:'.5px',marginBottom:6}}>{l}</div>
                        <div style={{width:'100%',aspectRatio:'544 / 443',background:'#050505',borderRadius:8,border:'1px solid #1f2937',overflow:'hidden'}}>
                          <img src={grafs[k]} alt={l}
                            style={{width:'100%',height:'100%',objectFit:'contain',display:'block'}}/>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {comentGrafs.geral && (
                <div style={{marginTop:10,padding:'10px 11px',borderRadius:8,background:'#f8fafc',border:'1px solid #e2e8f0'}}>
                  <div style={{fontSize:9,fontWeight:800,color:'#64748b',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:4}}>Comentário geral dos gráficos</div>
                  <div style={{fontSize:12,lineHeight:1.55,color:'#334155',whiteSpace:'pre-line'}}>{comentGrafs.geral}</div>
                </div>
              )}
            </Card>
          </Secao>
        );
      })()}

      {/* 8. EVOLUÇÃO */}
      {hist.ordenadas.length>=2&&(
        <Secao ordem={110} titulo="Sua evolução" sub="Progresso ao longo das avaliações">
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
            {/* Evolução dos scores com leitura clínica */}
            <div style={{gridColumn:'1 / -1'}}>
              <Card bg="#ffffff" style={{boxShadow:'0 18px 42px rgba(15,23,42,.05)'}}>
                <h3 style={{fontSize:14,fontWeight:700,color:'#0f172a',margin:'0 0 4px'}}>Evolução dos scores</h3>
                <p style={{fontSize:12,color:'#94a3b8',margin:'0 0 18px'}}>Tendência visual dos principais domínios avaliados</p>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:14}}>
                  {[
                    {
                      nome:'Score Global',
                      pontos:hist.series.scoreGlobal,
                      cor:'#10b981',
                      escopo:'Integra os módulos disponíveis',
                      leitura:'Pontuação geral de 0 a 100, não é uma medida corporal isolada.',
                    },
                    {
                      nome:'Postura',
                      pontos:hist.series.scorePostura,
                      cor:'#60a5fa',
                      escopo:'Achados posturais e alinhamento',
                      leitura:'Score postural 0-100 calculado a partir dos achados da posturografia.',
                    },
                    {
                      nome:'Composição',
                      pontos:hist.series.scoreComposicao,
                      cor:'#f59e0b',
                      escopo:'Gordura, massa magra, IMC e RCQ',
                      leitura:'Score composto 0-100; os valores brutos ficam em % gordura, kg e medidas corporais.',
                    },
                    {
                      nome:'Força',
                      pontos:hist.series.scoreForca,
                      cor:'#8b5cf6',
                      escopo:'Preensão, dinamometria e assimetria',
                      leitura:'Score de força 0-100; não representa kgf ou kg isoladamente.',
                    },
                    {
                      nome:'Cardio',
                      pontos:hist.series.scoreCardio,
                      cor:'#ef4444',
                      escopo:'VO2máx, FC e zonas de treino',
                      leitura:'Score cardiorrespiratório 0-100; BPM e VO2máx aparecem nos blocos específicos.',
                    },
                  ].map(({nome,pontos,cor,escopo,leitura})=>(
                    <div key={nome} style={{background:'linear-gradient(180deg,#ffffff,#f8fafc)',borderRadius:16,
                      padding:'18px 20px 14px',border:'1px solid #dbe7ef',boxShadow:'inset 0 1px 0 rgba(255,255,255,.9), 0 12px 28px rgba(15,23,42,.045)'}}>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,marginBottom:8}}>
                        <div>
                          <div style={{fontSize:12,fontWeight:900,color:'#475569',textTransform:'uppercase',letterSpacing:'.7px'}}>{nome}</div>
                          <div style={{fontSize:11,color:'#64748b',marginTop:4,lineHeight:1.35}}>{escopo}</div>
                        </div>
                        <div style={{width:34,height:6,borderRadius:999,background:cor,boxShadow:`0 8px 18px ${cor}45`}}/>
                      </div>
                      <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:10}}>
                        <span style={{fontSize:10,fontWeight:800,color:'#334155',background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:999,padding:'4px 8px'}}>Score 0-100</span>
                        <span style={{fontSize:10,fontWeight:700,color:'#64748b',background:'#ffffff',border:'1px solid #e2e8f0',borderRadius:999,padding:'4px 8px'}}>Evolução longitudinal</span>
                      </div>
                      <div style={{fontSize:11,color:'#64748b',lineHeight:1.45,marginBottom:8}}>{leitura}</div>
                      <LineChart yMin={0} yMax={100} series={[{nome,pontos,cor}]} altura={220} showLabels={false}/>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
            {/* Scores atuais — barras */}
            <Card bg="#f8fafc">
              <h3 style={{fontSize:13,fontWeight:600,color:'#475569',margin:'0 0 16px'}}>Scores por capacidade</h3>
              <ScoresBarChart series={allScores}/>
            </Card>
            {/* Outros gráficos */}
            {[
              {t:'Peso & Massa magra (kg)',s:[
                {nome:'Peso',pontos:hist.series.peso,cor:'#64748b'},
                {nome:'Massa magra',pontos:hist.series.massaMagra,cor:'#10b981'}]},
              {t:'% Gordura corporal',s:[{nome:'% Gordura',pontos:hist.series.pctGordura,cor:'#f59e0b'}]},
              {t:'VO₂máx (ml/kg/min)',s:[{nome:'VO₂máx',pontos:hist.series.vo2max,cor:'#10b981'}]},
            ].map(({t,s})=>(
              <Card key={t} bg="#f8fafc">
                <h3 style={{fontSize:13,fontWeight:600,color:'#475569',margin:'0 0 10px'}}>{t}</h3>
                <LineChart series={s} altura={190}/>
              </Card>
            ))}
          </div>
        </Secao>
      )}

      {/* 9. HISTÓRICO */}
      <Secao ordem={120} titulo="Histórico de avaliações">
        <Card>
          {hist.ordenadas.slice().reverse().map((a,i)=>(
            <div key={a.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',
              padding:'10px 0',borderBottom:i<hist.ordenadas.length-1?'1px solid #f1f5f9':'none'}}>
              <div>
                <div style={{fontSize:13,fontWeight:600,color:'#0f172a'}}>
                  {new Date(a.data).toLocaleDateString('pt-BR',{dateStyle:'long'})}
                </div>
                <div style={{fontSize:11,color:'#94a3b8',marginTop:2}}>
                  {a.tipo} · Score: <b style={{color:'#0f172a'}}>{a.scores?.global??'—'}</b>
                </div>
              </div>
              <span style={{fontSize:10,padding:'3px 10px',borderRadius:100,fontWeight:600,
                background:'#f0fdf4',color:'#166534',border:'1px solid #bbf7d0'}}>Concluída</span>
            </div>
          ))}
        </Card>
      </Secao>

      <div style={{textAlign:'center',fontSize:10,color:'#cbd5e1',padding:'8px 0 20px'}}>
        Dashboard compartilhado pelo seu avaliador. Dados pessoais e laudos são confidenciais.
      </div>
    </div>
  );
}
