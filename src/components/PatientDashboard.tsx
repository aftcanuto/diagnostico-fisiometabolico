'use client';
import { useMemo, useState } from 'react';
import { LineChart } from '@/components/ui/LineChart';
import { BarChart } from '@/components/ui/BarChart';
import { ZonasChart } from '@/components/ui/ZonasChart';
import { DeltaBadge } from '@/components/ui/DeltaBadge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';
import { Camera, FileDown, TrendingUp, Activity, Heart, Dumbbell, User, Sparkles, Trash2, Pencil, ChevronDown, Info } from 'lucide-react';
import { consolidarHistorico, type AvaliacaoHidratada } from '@/lib/historico';
import { calcIdade } from '@/lib/calculations/antropometria';
import { createClient } from '@/lib/supabase/client';
import { EditarPacienteModal } from '@/components/EditarPacienteModal';
import { SilhuetaCircunferencias } from '@/components/ui/SilhuetaCircunferencias';
import { upsertModulo } from '@/lib/modulos';

interface Props {
  paciente: { nome: string; sexo: 'M' | 'F'; data_nascimento: string; email?: string | null; cpf?: string | null };
  avaliador?: { nome: string; conselho?: string | null } | null;
  avaliacoes: AvaliacaoHidratada[];
  pdfBaseUrl: string;
  modo?: 'clinico' | 'publico';
  quickEditAberto?: boolean;
}

/* ── Cores por zona ─────────────────────────────────── */
function zoneColor(v: number | null) {
  if (v == null) return '#6b7280';
  if (v <= 40) return '#ef4444';
  if (v <= 70) return '#f59e0b';
  return '#10b981';
}
function zoneLabel(v: number | null) {
  if (v == null) return '—';
  if (v <= 40) return 'Crítico';
  if (v <= 70) return 'Atenção';
  return 'Ótimo';
}

/* ── Gauge SVG — mesmo estilo do PDF ──────────────────── */
function GaugeSVG({ value, label, size = 'sm' }: { value: number | null; label: string; size?: 'lg' | 'sm' }) {
  const isLg = size === 'lg';
  const vw = isLg ? 200 : 160;
  const vh = isLg ? 168 : 118;
  const cx = vw / 2, cy = isLg ? 104 : 88;
  const r  = isLg ? 80 : 64;
  const sw = isLg ? 14 : 11;
  const tw = isLg ? 9  : 7;
  const tl = isLg ? 14 : 11;
  const gid = `dg${size}${value ?? 'N'}${Math.random().toString(36).slice(2,5)}`;
  const pct = Math.max(0, Math.min(100, value ?? 0));
  const rot = (pct - 100) * 1.8;
  const rOuter = r + sw / 2 + 3;
  const t1 = `${(cx + rOuter + tl).toFixed(1)},${cy}`;
  const t2 = `${(cx + rOuter).toFixed(1)},${(cy - tw).toFixed(1)}`;
  const t3 = `${(cx + rOuter).toFixed(1)},${(cy + tw).toFixed(1)}`;
  const col = zoneColor(value);
  const fsize = isLg ? 38 : 28;
  const lfsize = isLg ? 11 : 9;
  const needleLen = r - sw / 2 - 6;
  const needleRad = Math.PI * (1 - pct / 100);
  const nx = (cx + needleLen * Math.cos(needleRad)).toFixed(1);
  const ny = (cy - needleLen * Math.sin(needleRad)).toFixed(1);

  return (
    <div className="flex flex-col items-center">
      <svg viewBox={`0 0 ${vw} ${vh}`} style={{ width: '100%', display: 'block', overflow: 'visible' }}
        xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#ef4444"/>
            <stop offset="25%"  stopColor="#f97316"/>
            <stop offset="50%"  stopColor="#eab308"/>
            <stop offset="75%"  stopColor="#22c55e"/>
            <stop offset="100%" stopColor="#06b6d4"/>
          </linearGradient>
          <filter id={`${gid}sh`} x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#0f172a" floodOpacity=".18"/>
          </filter>
        </defs>
        {/* Trilho */}
        <path d={`M${cx-r},${cy} A${r},${r} 0 0,1 ${cx+r},${cy}`}
          fill="none" stroke="#0f172a" strokeWidth={sw+5} strokeLinecap="round" opacity=".9"/>
        <path d={`M${cx-r},${cy} A${r},${r} 0 0,1 ${cx+r},${cy}`}
          fill="none" stroke="#e2e8f0" strokeWidth={sw+1} strokeLinecap="round"/>
        {/* Arco gradiente */}
        <path d={`M${cx-r},${cy} A${r},${r} 0 0,1 ${cx+r},${cy}`}
          fill="none" stroke={`url(#${gid})`} strokeWidth={sw} strokeLinecap="round"/>
        {/* Ticks */}
        {[0,25,50,75,100].map(t => {
          const rad = Math.PI * (1 - t / 100);
          const xi = (cx + (r+sw/2+3) * Math.cos(rad)).toFixed(1);
          const yi = (cy - (r+sw/2+3) * Math.sin(rad)).toFixed(1);
          const xo = (cx + (r+sw/2+8) * Math.cos(rad)).toFixed(1);
          const yo = (cy - (r+sw/2+8) * Math.sin(rad)).toFixed(1);
          const xl = (cx + (r+sw/2+14) * Math.cos(rad)).toFixed(1);
          const yl = (cy - (r+sw/2+14) * Math.sin(rad)).toFixed(1);
          return (
            <g key={t}>
              <line x1={xi} y1={yi} x2={xo} y2={yo} stroke="#374151" strokeWidth="1.5"/>
              <text x={xl} y={yl} textAnchor="middle" dominantBaseline="middle"
                fontSize={lfsize} fill="#4b5563" fontFamily="Inter,Arial">{t}</text>
            </g>
          );
        })}
        {/* Triângulo indicador */}
        {value != null && (
          <>
            <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#0f172a" strokeWidth={isLg ? 4 : 3} strokeLinecap="round" filter={`url(#${gid}sh)`}/>
            <polygon points={`${t1} ${t2} ${t3}`} fill={col}
              transform={`rotate(${rot.toFixed(2)},${cx},${cy})`} filter={`url(#${gid}sh)`}/>
            <circle cx={cx} cy={cy} r={isLg ? 9 : 7} fill="#fff" stroke="#cbd5e1" strokeWidth="1.5"/>
            <circle cx={cx} cy={cy} r={isLg ? 4 : 3} fill="#0f172a"/>
          </>
        )}
        {/* Valor */}
        <text x={cx} y={(isLg ? cy + 42 : cy + 24).toFixed(1)} textAnchor="middle"
          fontSize={fsize} fontWeight="800" fill={col} fontFamily="Inter,Arial">
          {value ?? '—'}
        </text>
      </svg>
      <div style={{ fontSize: isLg ? 11 : 10, fontWeight: 600, color: '#475569',
        textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 }}>{label}</div>
      <div style={{ display: 'inline-block', marginTop: 5, padding: '3px 12px',
        borderRadius: 100, fontSize: isLg ? 11 : 10, fontWeight: 600,
        background: `${col}22`, color: col }}>{zoneLabel(value)}</div>
    </div>
  );
}

/* ── Barra de progresso de score ──────────────────────── */
function ScoreBar({ label, value, anterior, icon: Icon }: {
  label: string; value: number | null; anterior?: number | null; icon: any;
}) {
  const col = zoneColor(value);
  const pct = Math.max(0, Math.min(100, value ?? 0));
  const circ = 2 * Math.PI * 18;
  const dash = (pct / 100 * circ).toFixed(1);
  const off  = (circ * 0.25).toFixed(1);

  return (
    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0',
      borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
      {/* Mini gauge circular */}
      <div style={{ flexShrink: 0, width: 48, height: 48 }}>
        <svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" style={{ overflow: 'visible' }}>
          <circle cx="24" cy="24" r="18" fill="none" stroke="#1f2937" strokeWidth="5"/>
          <circle cx="24" cy="24" r="18" fill="none" stroke={col} strokeWidth="5"
            strokeDasharray={`${dash} ${circ}`} strokeDashoffset={off}
            strokeLinecap="round" transform="rotate(-90 24 24)"/>
          <text x="24" y="28" textAnchor="middle" fontSize="11" fontWeight="800"
            fill={col} fontFamily="Inter,Arial">{value ?? '—'}</text>
        </svg>
      </div>
      {/* Label + barra */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon size={13} style={{ opacity: .7 }} /> {label}
          </span>
          <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 10px',
            borderRadius: 100, background: `${col}20`, color: col }}>{zoneLabel(value)}</span>
        </div>
        <div style={{ background: '#1f2937', borderRadius: 999, height: 6, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`,
            background: `linear-gradient(90deg,${col}88,${col})`, borderRadius: 999 }}/>
        </div>
        {anterior != null && value != null && (
          <div style={{ marginTop: 4, fontSize: 10, color: '#94a3b8' }}>
            Anterior: {anterior}
            {value > anterior
              ? <span style={{ color: '#10b981', marginLeft: 4 }}>▲ +{(value - anterior)}</span>
              : value < anterior
                ? <span style={{ color: '#ef4444', marginLeft: 4 }}>▼ {(value - anterior)}</span>
                : <span style={{ color: '#6b7280', marginLeft: 4 }}>→ sem alteração</span>}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Cartão de métrica ────────────────────────────────── */
function MetricCard({ label, value, unit, color = '#0f172a' }: {
  label: string; value: any; unit?: string; color?: string;
}) {
  value = formatDashboardValue(value);
  return (
    <div style={{ background: '#f8fafc', borderRadius: 10,
      padding: 10, textAlign: 'center' }}>
      <div style={{ fontSize: 18, fontWeight: 800, color, lineHeight: 1 }}>
        {value ?? '—'}{unit && <span style={{ fontSize: 11, fontWeight: 400, color: '#94a3b8', marginLeft: 2 }}>{unit}</span>}
      </div>
      <div style={{ fontSize: 8, color: '#94a3b8', textTransform: 'uppercase',
        letterSpacing: '.5px', marginTop: 2 }}>{label}</div>
    </div>
  );
}

function MetricLine({ label, value, unit, color }: { label: string; value: any; unit?: string; color?: string }) {
  value = formatDashboardValue(value);
  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:14,
      padding:'10px 13px',background:'#f8fafc',borderRadius:10,border:'1px solid #f1f5f9',minWidth:0}}>
      <div style={{fontSize:10,color:'#94a3b8',fontWeight:800,textTransform:'uppercase',letterSpacing:'.5px',lineHeight:1.25}}>{label}</div>
      <div style={{display:'flex',alignItems:'baseline',gap:4,minWidth:0,textAlign:'right',whiteSpace:'nowrap'}}>
        <span style={{fontSize:16,fontWeight:900,color:color??'#0f172a',lineHeight:1.15}}>{value??'—'}</span>
        {unit&&<span style={{fontSize:10,fontWeight:500,color:'#94a3b8'}}>{unit}</span>}
      </div>
    </div>
  );
}

function PreviewMetricLine({ label, value }: { label: string; value: any }) {
  const text = formatDashboardValue(value);
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{position:'relative',display:'flex',alignItems:'center',justifyContent:'flex-start',gap:12,
        padding:'10px 13px',background:'#f8fafc',borderRadius:10,border:'1px solid #f1f5f9',minWidth:0}}>
      <div style={{fontSize:10,color:'#94a3b8',fontWeight:800,textTransform:'uppercase',letterSpacing:'.5px',lineHeight:1.25,flex:'0 0 140px'}}>{label}</div>
      <button type="button" onClick={()=>setOpen(v=>!v)}
        style={{fontSize:13,fontWeight:600,color:'#0f172a',lineHeight:1.25,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',minWidth:0,flex:1,textAlign:'left',border:0,background:'transparent',padding:0,cursor:'pointer'}}>
        {text}
      </button>
      <button type="button" aria-label="Ver texto completo" onClick={()=>setOpen(v=>!v)} style={{width:22,height:22,borderRadius:999,display:'flex',alignItems:'center',justifyContent:'center',
        flexShrink:0,background:'#ecfdf5',border:'1px solid #bbf7d0',color:'#047857',fontSize:12,fontWeight:900,cursor:'help'}}>
        i
      </button>
      {open && (
        <div style={{position:'absolute',zIndex:20,right:0,bottom:'calc(100% + 8px)',width:'min(420px,80vw)',maxHeight:280,overflowY:'auto',
          padding:'12px 14px',background:'#0f172a',color:'#fff',borderRadius:12,boxShadow:'0 18px 40px rgba(15,23,42,.22)',
          fontSize:12,lineHeight:1.7,fontWeight:500,whiteSpace:'pre-line'}}>
          {text}
        </div>
      )}
    </div>
  );
}

function formatDashboardValue(v: any): string {
  if (v == null || v === '') return '-';
  if (typeof v === 'boolean') return v ? 'Sim' : 'Nao';
  if (typeof v !== 'object') return String(v);
  if (Array.isArray(v)) {
    const itens = v.map(formatDashboardValue).filter(x => x && x !== '-');
    return itens.length ? itens.join('\n') : '-';
  }
  const pares = Object.entries(v)
    .filter(([, val]) => val != null && val !== '' && !(typeof val === 'object' && Object.keys(val as any).length === 0))
    .map(([k, val]) => `${humanField(k)}: ${formatDashboardValue(val)}`);
  return pares.length ? pares.join('\n') : '-';
}

function FfmiCard({ffmi,massaMagra,massaOssea,peso,altura,sexo}:{ffmi:number|null; massaMagra:number|null; massaOssea:number|null; peso:number|null; altura:number|null; sexo:'M'|'F'}) {
  if(ffmi==null&&massaMagra==null)return null;
  const alturaM=altura?altura/100:null;
  const limiteFfmi=sexo==='M'?25:20.3;
  const massaMax=alturaM?+(limiteFfmi*alturaM*alturaM).toFixed(1):null;
  const pct=massaMagra!=null&&massaMax?Math.max(0,Math.min(100,+((massaMagra/massaMax)*100).toFixed(1))):null;
  return (
    <div style={{background:'white',border:'1px solid #e2e8f0',borderRadius:16,padding:'24px 28px',color:'#0f172a'}}>
      <div style={{fontSize:18,fontWeight:900,marginBottom:4}}>FFMI e potencial muscular</div>
      <div style={{fontSize:12,color:'#94a3b8',marginBottom:16}}>Índice de massa livre de gordura e limite natural estimado</div>
      <div style={{display:'grid',gridTemplateColumns:'minmax(170px,.7fr) minmax(260px,1.3fr)',gap:20,alignItems:'center'}}>
        <div style={{padding:'18px',borderRadius:14,background:'#f8fafc',border:'1px solid #e2e8f0'}}>
          <div style={{fontSize:10,fontWeight:900,letterSpacing:'1.2px',textTransform:'uppercase',color:'#94a3b8',marginBottom:8}}>FFMI</div>
          <div style={{fontSize:52,fontWeight:950,lineHeight:.95,letterSpacing:'-1px',color:'#10b981'}}>{ffmi??'—'}</div>
          <div style={{fontSize:12,fontWeight:700,color:'#64748b',marginTop:8}}>Índice de massa livre de gordura</div>
        </div>
        <div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:8,marginBottom:16}}>
            {massaMagra!=null&&<MetricLine label="Massa magra" value={massaMagra} unit="kg"/>}
            {massaOssea!=null&&<MetricLine label="Massa óssea" value={massaOssea} unit="kg"/>}
            {peso!=null&&<MetricLine label="Peso corporal" value={peso} unit="kg"/>}
            {altura!=null&&<MetricLine label="Estatura" value={altura} unit="cm"/>}
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
    </div>
  );
}

/* ── CompRow (comparativo) ────────────────────────────── */
function CompRow({ label, atual, anterior, unidade, direcao, casas = 1 }: {
  label: string; atual: any; anterior: any; unidade: string;
  direcao: 'subir_bom' | 'descer_bom'; casas?: number;
}) {
  const a = atual != null ? Number(atual) : null;
  const p = anterior != null ? Number(anterior) : null;
  const diff = a != null && p != null ? +(a - p).toFixed(casas) : null;
  const bom = diff == null ? false : direcao === 'subir_bom' ? diff > 0 : diff < 0;
  const cor = diff == null ? '#94a3b8' : bom ? '#10b981' : diff === 0 ? '#64748b' : '#ef4444';
  return (
    <div style={{background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:14,padding:'13px 15px',minWidth:0}}>
      <div style={{display:'flex',justifyContent:'space-between',gap:10,alignItems:'flex-start'}}>
        <div>
          <div style={{fontSize:10,fontWeight:800,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:6}}>{label}</div>
          <div style={{fontSize:20,fontWeight:900,color:'#0f172a',lineHeight:1.05,whiteSpace:'nowrap'}}>
            {a != null ? a.toFixed(casas) : '—'}{unidade && <span style={{fontSize:11,fontWeight:600,color:'#64748b',marginLeft:3}}>{unidade.trim()}</span>}
          </div>
        </div>
        {diff != null && (
          <div style={{fontSize:11,fontWeight:900,color:cor,background:`${cor}14`,border:`1px solid ${cor}30`,borderRadius:999,padding:'3px 8px',whiteSpace:'nowrap'}}>
            {diff > 0 ? '+' : ''}{diff}{unidade.trim() && <span style={{fontWeight:700,marginLeft:2}}>{unidade.trim()}</span>}
          </div>
        )}
      </div>
      {p != null && (
        <div style={{fontSize:11,color:'#94a3b8',marginTop:9}}>Anterior: <b style={{color:'#64748b'}}>{p.toFixed(casas)}{unidade}</b></div>
      )}
    </div>
  );
}

function rotuloCirc(k: string): string {
  const m: Record<string, string> = {
    braco_relaxado: 'Braço relax.', braco_contraido: 'Braço contr.', antebraco: 'Antebraço',
    torax: 'Tórax', cintura: 'Cintura', abdome: 'Abdome', quadril: 'Quadril',
    coxa_proximal: 'Coxa prox.', coxa_medial: 'Coxa med.', panturrilha: 'Panturrilha',
  };
  return m[k] ?? k.replace(/_/g, ' ');
}

function cleanModulo(row: any) {
  if (!row || typeof row !== 'object') return {};
  const omit = new Set(['id','avaliacao_id','created_at','updated_at','clinica_id','paciente_id','avaliador_id']);
  return Object.fromEntries(Object.entries(row).filter(([k]) => !omit.has(k)));
}

function humanField(k: string) {
  return k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function fieldKind(v: any) {
  if (typeof v === 'boolean') return 'boolean';
  if (typeof v === 'number') return 'number';
  if (v && typeof v === 'object') return 'json';
  return 'text';
}

function stringifyField(v: any) {
  if (v == null) return '';
  if (typeof v === 'object') return JSON.stringify(v, null, 2);
  return String(v);
}

function parseField(v: string, kind: string) {
  if (v.trim() === '') return null;
  if (kind === 'number') {
    const n = Number(v.replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  }
  if (kind === 'boolean') return v === 'true';
  return v;
}

function parseNumeroSeguro(v: any): number | null {
  if (v == null || v === '') return null;
  const n = typeof v === 'string' ? Number(v.replace(',', '.')) : Number(v);
  return Number.isFinite(n) ? n : null;
}

function cloneData<T>(v: T): T {
  return v == null ? v : JSON.parse(JSON.stringify(v));
}

function labelSegment(seg: string | number) {
  if (typeof seg === 'number') return String(seg + 1);
  return humanField(seg);
}

type FlatField = { id: string; path: (string | number)[]; label: string; value: any; kind: string };

function flattenEditable(value: any, path: (string | number)[] = []): FlatField[] {
  if (value == null || typeof value !== 'object') {
    return [{
      id: path.join('__'),
      path,
      label: path.map(labelSegment).join(' / '),
      value,
      kind: fieldKind(value),
    }];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item, i) => flattenEditable(item, [...path, i]));
  }
  return Object.entries(value).flatMap(([k, v]) => flattenEditable(v, [...path, k]));
}

function setPathValue(target: any, path: (string | number)[], value: any) {
  let cur = target;
  for (let i = 0; i < path.length - 1; i++) cur = cur[path[i]];
  cur[path[path.length - 1]] = value;
}

function QuickModuleEditor({ avaliacaoId, label, tabela, row, onSaved }: { avaliacaoId: string; label: string; tabela: string; row: any; onSaved?: () => void }) {
  const data = cleanModulo(row);
  const flatFields = flattenEditable(data).filter(f => f.path.length > 0);
  const [draft, setDraft] = useState<Record<string,string>>(
    () => Object.fromEntries(flatFields.map(f => [f.id, stringifyField(f.value)]))
  );
  const [status, setStatus] = useState<'idle'|'saving'|'saved'|'error'>('idle');
  if (!flatFields.length) return null;

  async function salvar() {
    setStatus('saving');
    try {
      const payload: Record<string, any> = cloneData(data);
      for (const f of flatFields) setPathValue(payload, f.path, parseField(draft[f.id] ?? '', f.kind));
      await upsertModulo(tabela, avaliacaoId, payload);
      setStatus('saved');
      setTimeout(() => {
        setStatus('idle');
        onSaved?.();
      }, 650);
    } catch (e) {
      console.error(e);
      setStatus('error');
    }
  }

  return (
    <div style={{border:'1px solid #e2e8f0',borderRadius:14,background:'#fff',overflow:'hidden'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,padding:'13px 16px',background:'#f8fafc',borderBottom:'1px solid #e2e8f0'}}>
        <div>
          <div style={{fontSize:13,fontWeight:900,color:'#0f172a'}}>{label}</div>
          <div style={{fontSize:10,color:'#94a3b8',marginTop:2}}>Edição rápida dos campos salvos</div>
        </div>
        <button onClick={salvar} disabled={status==='saving'}
          style={{border:'1px solid #bbf7d0',background:'#f0fdf4',color:'#047857',borderRadius:10,padding:'7px 12px',fontSize:11,fontWeight:900,cursor:'pointer'}}>
          {status==='saving'?'Salvando...':status==='saved'?'Salvo':'Salvar'}
        </button>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:10,padding:14}}>
        {flatFields.map((f) => {
          const big = String(draft[f.id] ?? '').length > 80 || /observ|coment|analise|achado|texto|descricao|histor/i.test(f.id);
          return (
            <label key={f.id} style={{display:'flex',flexDirection:'column',gap:5,gridColumn:big?'1 / -1':undefined}}>
              <span style={{fontSize:10,fontWeight:900,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'.5px'}}>{f.label}</span>
              {f.kind === 'boolean' ? (
                <select value={draft[f.id] ?? ''} onChange={e=>setDraft(d=>({...d,[f.id]:e.target.value}))}
                  style={{height:38,border:'1px solid #e2e8f0',borderRadius:10,padding:'0 10px',fontSize:13,fontWeight:700,color:'#0f172a',background:'#fff'}}>
                  <option value="true">Sim</option>
                  <option value="false">Não</option>
                </select>
              ) : big ? (
                <textarea value={draft[f.id] ?? ''} onChange={e=>setDraft(d=>({...d,[f.id]:e.target.value}))}
                  rows={4}
                  style={{border:'1px solid #e2e8f0',borderRadius:10,padding:10,fontSize:13,lineHeight:1.45,color:'#0f172a',background:'#fff'}}/>
              ) : (
                <input value={draft[f.id] ?? ''} onChange={e=>setDraft(d=>({...d,[f.id]:e.target.value}))}
                  type={f.kind==='number'?'number':'text'} step="any"
                  style={{height:38,border:'1px solid #e2e8f0',borderRadius:10,padding:'0 10px',fontSize:13,fontWeight:700,color:'#0f172a',background:'#fff'}}/>
              )}
            </label>
          );
        })}
      </div>
      {status==='error'&&<div style={{padding:'0 14px 14px',fontSize:12,color:'#dc2626'}}>Não foi possível salvar. Confira os campos preenchidos.</div>}
    </div>
  );
}

function QuickAiEditor({ avaliacaoId, analises, onSaved }: { avaliacaoId: string; analises: any; onSaved?: () => void }) {
  const entries = analises && typeof analises === 'object'
    ? Object.entries(analises).map(([tipo, v]: any) => ({
        tipo,
        texto: typeof v === 'string' ? v : (v?.texto_editado ?? renderAiText(v?.conteudo ?? v))
      })).filter(e => e.texto != null)
    : [];
  const [draft, setDraft] = useState<Record<string,string>>(() => Object.fromEntries(entries.map(e => [e.tipo, String(e.texto ?? '')])));
  const [status, setStatus] = useState<'idle'|'saving'|'saved'|'error'>('idle');
  if (!entries.length) return null;

  async function salvar() {
    setStatus('saving');
    try {
      await Promise.all(entries.map(e => fetch('/api/ia/editar', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ avaliacaoId, tipo:e.tipo, textoEditado:draft[e.tipo] ?? '' })
      }).then(r => { if (!r.ok) throw new Error('erro'); })));
      setStatus('saved');
      setTimeout(() => {
        setStatus('idle');
        onSaved?.();
      }, 650);
    } catch {
      setStatus('error');
    }
  }

  return (
    <div style={{border:'1px solid #e2e8f0',borderRadius:14,background:'#fff',overflow:'hidden'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,padding:'13px 16px',background:'#f8fafc',borderBottom:'1px solid #e2e8f0'}}>
        <div>
          <div style={{fontSize:13,fontWeight:900,color:'#0f172a'}}>Análises clínicas</div>
          <div style={{fontSize:10,color:'#94a3b8',marginTop:2}}>Textos de IA e comentários revisáveis</div>
        </div>
        <button onClick={salvar} disabled={status==='saving'}
          style={{border:'1px solid #bbf7d0',background:'#f0fdf4',color:'#047857',borderRadius:10,padding:'7px 12px',fontSize:11,fontWeight:900,cursor:'pointer'}}>
          {status==='saving'?'Salvando...':status==='saved'?'Salvo':'Salvar'}
        </button>
      </div>
      <div style={{display:'grid',gap:10,padding:14}}>
        {entries.map(e => (
          <label key={e.tipo} style={{display:'flex',flexDirection:'column',gap:5}}>
            <span style={{fontSize:10,fontWeight:900,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'.5px'}}>{humanField(e.tipo)}</span>
            <textarea value={draft[e.tipo] ?? ''} onChange={ev=>setDraft(d=>({...d,[e.tipo]:ev.target.value}))}
              rows={5}
              style={{border:'1px solid #e2e8f0',borderRadius:10,padding:10,fontSize:13,lineHeight:1.5,color:'#0f172a',background:'#fff'}}/>
          </label>
        ))}
      </div>
      {status==='error'&&<div style={{padding:'0 14px 14px',fontSize:12,color:'#dc2626'}}>Não foi possível salvar as análises.</div>}
    </div>
  );
}

function renderAiText(c: any): string {
  if (!c) return '';
  if (typeof c === 'string') return c;
  const partes: string[] = [];
  if (c.resumo_executivo) partes.push(`RESUMO:\n${c.resumo_executivo}`);
  if (c.interpretacao) partes.push(`INTERPRETAÇÃO:\n${c.interpretacao}`);
  const listas: [string, any[] | undefined][] = [
    ['ACHADOS', c.achados],
    ['RISCOS', c.riscos],
    ['BENEFÍCIOS', c.beneficios],
    ['RECOMENDAÇÕES', c.recomendacoes],
    ['ALERTAS', c.alertas],
    ['PONTOS FORTES', c.pontos_fortes],
    ['PONTOS CRÍTICOS', c.pontos_criticos],
    ['TENDÊNCIAS', c.tendencias],
    ['PROGRESSOS', c.progressos],
    ['REGRESSÕES', c.regressoes],
    ['PRÓXIMOS PASSOS', c.proximos_passos],
  ];
  listas.forEach(([titulo, itens]) => {
    if (Array.isArray(itens) && itens.length) partes.push(`${titulo}:\n${itens.map((item: any) => `- ${item}`).join('\n')}`);
  });
  if (Array.isArray(c.prioridades) && c.prioridades.length) {
    partes.push(`PRIORIDADES:\n${c.prioridades.map((p: any) => `- ${p.titulo ?? 'Prioridade'}: ${p.acao ?? ''}${p.prazo ? ` (${p.prazo})` : ''}`).join('\n')}`);
  }
  if (c.mensagem_paciente) partes.push(`MENSAGEM AO PACIENTE:\n${c.mensagem_paciente}`);
  return partes.join('\n\n');
}

function textoAnaliseClinica(v: any): string {
  if (!v) return '';
  if (typeof v === 'string') return v;
  return String(v.texto_editado ?? v.texto ?? renderAiText(v.conteudo ?? v) ?? '').trim();
}

function formatAnaliseLeitura(texto: string) {
  return texto
    .replace(/\s+(Achados:|Alertas:|Beneficios:|Benef?cios:|Riscos:|Prioridades:|Pontos Fortes:|Pontos Criticos:|Pontos Cr?ticos:)/g, '\n\n$1')
    .replace(/,\s+(?=[A-Z???????????][a-z???????????]+:)/g, '\n')
    .trim();
}

function AnaliseInfoTooltip({ texto }: { texto: string }) {
  const [open, setOpen] = useState(false);
  if (!texto) return null;
  const textoFormatado = formatAnaliseLeitura(texto);
  return (
    <span
      onBlur={() => setOpen(false)}
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
    >
      <button
        type="button"
        aria-label="Ver análise clínica"
        onClick={(e)=>{e.stopPropagation();setOpen(v=>!v);}}
        style={{
          width: 28,
          height: 28,
          borderRadius: 999,
          border: '1px solid #bbf7d0',
          background: '#ecfdf5',
          color: '#047857',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'help',
          boxShadow: '0 8px 18px rgba(16,185,129,.12)',
        }}
      >
        <Info size={15} />
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            bottom: 34,
            zIndex: 50,
            width: 420,
            maxWidth: 'min(420px, calc(100vw - 48px))',
            maxHeight: 320,
            overflowY: 'auto',
            padding: '14px 16px',
            borderRadius: 14,
            background: '#ffffff',
            border: '1px solid #d1fae5',
            boxShadow: '0 24px 60px rgba(15,23,42,.18)',
            color: '#14532d',
            fontSize: 12,
            lineHeight: 1.75,
            fontWeight: 500,
            whiteSpace: 'pre-line',
          }}
        >
          <div style={{ fontSize: 10, fontWeight: 900, color: '#047857', textTransform: 'uppercase', letterSpacing: '.7px', marginBottom: 7 }}>
            Análise clínica
          </div>
          {textoFormatado}
        </div>
      )}
    </span>
  );
}

function QuickEditPanel({ avaliacao, defaultOpen = false }: { avaliacao: AvaliacaoHidratada; defaultOpen?: boolean }) {
  const [selected, setSelected] = useState<string | null>(defaultOpen ? '__first__' : null);
  const modules = [
    ['anamnese','Anamnese',(avaliacao as any).anamnese],
    ['sinais_vitais','Sinais vitais',(avaliacao as any).sinais_vitais],
    ['posturografia','Posturografia',(avaliacao as any).posturografia],
    ['bioimpedancia','Bioimpedância',(avaliacao as any).bioimpedancia],
    ['antropometria','Antropometria',(avaliacao as any).antropometria],
    ['flexibilidade','Flexibilidade',(avaliacao as any).flexibilidade],
    ['forca','Força',(avaliacao as any).forca],
    ['rml','RML',(avaliacao as any).rml],
    ['cardiorrespiratorio','Cardiorrespiratório',(avaliacao as any).cardiorrespiratorio],
    ['biomecanica_corrida','Biomecânica da corrida',(avaliacao as any).biomecanica_corrida],
    ['scores','Revisão e scores',(avaliacao as any).scores],
  ].filter(([, , row]) => row && Object.keys(cleanModulo(row)).length) as [string,string,any][];
  const activeKey = selected === '__first__' ? modules[0]?.[0] : selected;
  const active = modules.find(([key]) => key === activeKey);
  const hasAnalises = (avaliacao as any).analises_ia && Object.keys((avaliacao as any).analises_ia).length > 0;

  return (
    <div style={{background:'white',border:'1px solid #e2e8f0',borderRadius:16,padding:'18px 22px'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:14}}>
        <div>
          <div style={{fontSize:16,fontWeight:900,color:'#0f172a'}}>Edição rápida da avaliação</div>
          <div style={{fontSize:12,color:'#64748b',marginTop:3}}>Abra somente o módulo que deseja editar, seguindo a ordem da avaliação.</div>
        </div>
        {active&&<button onClick={()=>setSelected(null)}
          style={{display:'inline-flex',alignItems:'center',gap:8,border:'1px solid #d1fae5',background:'#ecfdf5',color:'#047857',borderRadius:12,padding:'9px 14px',fontSize:12,fontWeight:900,cursor:'pointer'}}>
          Fechar edição
        </button>}
      </div>
      <div style={{display:'flex',flexWrap:'wrap',gap:8,marginTop:16}}>
        {modules.map(([key,label])=>(
          <button key={key} onClick={()=>setSelected(key)}
            style={{display:'inline-flex',alignItems:'center',gap:7,border:`1px solid ${activeKey===key?'#10b981':'#e2e8f0'}`,background:activeKey===key?'#ecfdf5':'#f8fafc',color:activeKey===key?'#047857':'#334155',borderRadius:999,padding:'8px 12px',fontSize:11,fontWeight:900,cursor:'pointer'}}>
            <Pencil size={12}/> {label}
          </button>
        ))}
        {hasAnalises&&(
          <button onClick={()=>setSelected('__analises')}
            style={{display:'inline-flex',alignItems:'center',gap:7,border:`1px solid ${activeKey==='__analises'?'#10b981':'#e2e8f0'}`,background:activeKey==='__analises'?'#ecfdf5':'#f8fafc',color:activeKey==='__analises'?'#047857':'#334155',borderRadius:999,padding:'8px 12px',fontSize:11,fontWeight:900,cursor:'pointer'}}>
            <Pencil size={12}/> Análises clínicas
          </button>
        )}
      </div>
      {active&&(
        <div style={{marginTop:14}}>
          <QuickModuleEditor key={active[0]} avaliacaoId={avaliacao.id} tabela={active[0]} label={active[1]} row={active[2]} onSaved={()=>setSelected(null)}/>
        </div>
      )}
      {activeKey==='__analises'&&hasAnalises&&(
        <div style={{marginTop:14}}>
          <QuickAiEditor avaliacaoId={avaliacao.id} analises={(avaliacao as any).analises_ia} onSaved={()=>setSelected(null)}/>
        </div>
      )}
    </div>
  );
}

function BiomecanicaRunnerCompare({ ang }: { ang: Record<string, any> }) {
  const labels: Record<string, string> = {
    cabeca: 'Cabeça', tronco: 'Tronco', aterrissagem_passada: 'Aterrissagem',
    joelho_frente_contato: 'Joelho frente', joelho_posterior_contato: 'Joelho posterior',
    bracos: 'Braços', queda_pelve_esq: 'Pelve esq.', queda_pelve_dir: 'Pelve dir.',
    alinhamento_joelho_esq: 'Joelho esq.', alinhamento_joelho_dir: 'Joelho dir.',
    pronacao_supinacao_esq: 'Pronação/Supinação esq.', pronacao_supinacao_dir: 'Pronação/Supinação dir.',
    joelho_impacto: 'Joelho impacto', overstride: 'Overstride',
  };
  const principais = [
    'cabeca', 'tronco', 'aterrissagem_passada', 'joelho_frente_contato', 'joelho_posterior_contato', 'bracos',
    'queda_pelve_esq', 'queda_pelve_dir', 'alinhamento_joelho_esq', 'alinhamento_joelho_dir', 'pronacao_supinacao_esq', 'pronacao_supinacao_dir',
  ].filter(k => ang[k]);
  if (!principais.length) return null;
  const colorFor = (cls?: string) => cls === 'ideal' ? '#10b981' : cls === 'atencao' ? '#f59e0b' : '#ef4444';
  return (
    <div style={{ marginTop: 16, border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden', background: '#f8fafc' }}>
      <div style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: .7 }}>Régua angular - valor medido x faixa ideal</div>
      {[
        ['Plano sagital', principais.slice(0, 6)],
        ['Plano posterior', principais.slice(6)],
      ].map(([plano, keys]: any) => keys.length ? (
        <div key={plano}>
          <div style={{ padding: '12px 14px 4px', fontSize: 10, fontWeight: 900, color: '#0f172a', textTransform: 'uppercase', letterSpacing: .7 }}>{plano}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 10, padding: '0 14px 12px' }}>
        {keys.map((k: string) => {
          const v = ang[k]; const c = colorFor(v?.classificacao);
          const scaleMin = Math.min(0, v?.ideal_min ?? 0, v?.valor ?? 0);
          const scaleMax = Math.max(180, v?.ideal_max ?? 180, v?.valor ?? 0);
          const span = Math.max(1, scaleMax - scaleMin);
          const valPct = Math.max(0, Math.min(100, (((v?.valor ?? 0) - scaleMin) / span) * 100));
          const i0 = Math.max(0, Math.min(100, (((v?.ideal_min ?? 0) - scaleMin) / span) * 100));
          const i1 = Math.max(0, Math.min(100, (((v?.ideal_max ?? 0) - scaleMin) / span) * 100));
          const idealW = Math.max(4, i1 - i0);
          const status = v?.classificacao === 'ideal' ? 'Dentro do ideal' : v?.classificacao === 'atencao' ? 'Atenção' : 'Fora do ideal';
          return <div key={k} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: '10px 12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start', marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#334155', lineHeight: 1.2 }}>{labels[k] ?? k}</div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: c, lineHeight: 1 }}>{v.valor}°</div>
                <div style={{ fontSize: 8, fontWeight: 800, color: c, textTransform: 'uppercase', letterSpacing: .4, marginTop: 2 }}>{status}</div>
              </div>
            </div>
            <div style={{ position: 'relative', height: 18, background: '#edf2f7', borderRadius: 999, boxShadow: 'inset 0 1px 2px #0f172a18' }}>
              <div style={{ position: 'absolute', left: `${i0}%`, width: `${idealW}%`, top: 4, height: 10, background: 'linear-gradient(90deg,#86efac,#10b981)', borderRadius: 999, boxShadow: '0 0 0 1px #10b98133' }} />
              <div style={{ position: 'absolute', left: `${valPct}%`, top: '50%', transform: 'translate(-50%,-50%)', width: 3, height: 24, background: c, borderRadius: 2, boxShadow: `0 1px 5px ${c}55` }} />
              <div style={{ position: 'absolute', left: `${valPct}%`, top: '50%', transform: 'translate(-50%,-50%)', width: 11, height: 11, background: '#fff', border: `3px solid ${c}`, borderRadius: '50%' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, color: '#94a3b8', marginTop: 5 }}>
              <span>{scaleMin}°</span><span style={{ color: '#059669', fontWeight: 800 }}>ideal {v.ideal_min}°-{v.ideal_max}°</span><span>{scaleMax}°</span>
            </div>
          </div>;
        })}
          </div>
        </div>
      ) : null)}
      </div>
  );
}

/* ════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
════════════════════════════════════════════════════════ */
export function PatientDashboard({ paciente, avaliador, avaliacoes, pdfBaseUrl, modo = 'clinico', quickEditAberto = false }: Props) {
  const hist = useMemo(() => consolidarHistorico(avaliacoes), [avaliacoes]);
  const [avaliacaoSel, setAvaliacaoSel] = useState<string>(hist.ultima?.id ?? '');
  const atual = hist.ordenadas.find(a => a.id === avaliacaoSel) ?? hist.ultima;
  const anterior = atual && hist.ordenadas.findIndex(a => a.id === atual.id) > 0
    ? hist.ordenadas[hist.ordenadas.findIndex(a => a.id === atual.id) - 1]
    : null;

  const pdfHref = (id: string) => `${pdfBaseUrl}${id}`;

  if (!atual) {
    return (
      <div style={{ background: 'white', borderRadius: 16, padding: '48px 32px',
        textAlign: 'center', color: '#64748b', fontSize: 14 }}>
        Nenhuma avaliação finalizada ainda.
      </div>
    );
  }

  const sc = atual.scores ?? {};
  const ant = (d: string) => anterior?.scores?.[d] ?? null;
  const pctG   = atual.antropometria?.percentual_gordura ?? (atual as any).bioimpedancia?.percentual_gordura;
  const peso   = atual.antropometria?.peso ?? (atual as any).bioimpedancia?.peso_kg;
  const mlg    = atual.antropometria?.massa_magra ?? (atual as any).bioimpedancia?.massa_livre_gordura_kg;
  const imc    = atual.antropometria?.imc ?? (atual as any).bioimpedancia?.imc;
  const altura = atual.antropometria?.estatura ?? (atual as any).bioimpedancia?.altura_cm ?? null;
  const massaOssea = atual.antropometria?.massa_ossea ?? (atual as any).bioimpedancia?.massa_ossea_kg ?? null;
  const ffmiRaw = atual.antropometria?.ffmi as any;
  const ffmiSalvo = parseNumeroSeguro(
    typeof ffmiRaw === 'object'
      ? (ffmiRaw?.ffmiNorm ?? ffmiRaw?.ffmi ?? ffmiRaw?.valor ?? ffmiRaw?.resultado)
      : ffmiRaw
  );
  const massaMagraNum = parseNumeroSeguro(mlg);
  const alturaNum = parseNumeroSeguro(altura);
  const ffmiCalculado = massaMagraNum != null && alturaNum != null && alturaNum > 0
    ? +(massaMagraNum / ((alturaNum / 100) ** 2)).toFixed(1)
    : null;
  const ffmiValor = ffmiSalvo ?? ffmiCalculado;
  const pacienteNome = formatDashboardValue(paciente.nome);
  const pacienteSexo = paciente.sexo === 'M' ? 'M' : 'F';
  const pacienteNascimento = formatDashboardValue(paciente.data_nascimento);
  const avaliadorNome = formatDashboardValue(avaliador?.nome);
  const gorCor = pctG == null ? '#10b981' : pacienteSexo === 'M'
    ? pctG <= 15 ? '#10b981' : pctG <= 22 ? '#f59e0b' : '#ef4444'
    : pctG <= 21 ? '#10b981' : pctG <= 29 ? '#f59e0b' : '#ef4444';

  const scoreItems = [
    { label: 'Postura', v: sc.postura, icon: User },
    { label: 'Composição', v: sc.composicao_corporal, icon: Activity },
    { label: 'Força', v: sc.forca, icon: Dumbbell },
    ...(sc.flexibilidade != null ? [{ label: 'Flexibilidade', v: sc.flexibilidade, icon: TrendingUp }] : []),
    { label: 'Cardio', v: sc.cardiorrespiratorio, icon: Heart },
    ...(sc.rml != null ? [{ label: 'RML', v: sc.rml, icon: TrendingUp }] : []),
  ];

  const circItems = atual.antropometria?.circunferencias
    ? Object.entries(atual.antropometria.circunferencias)
        .filter(([, v]) => v != null && v !== '')
        .map(([k, v]) => ({ label: rotuloCirc(k), valor: Number(v) }))
    : [];
  const circ = atual.antropometria?.circunferencias ?? {};
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
  const diam=(atual.antropometria?.diametros_osseos??(atual.antropometria as any)?.diametros??{}) as Record<string, any>;
  const diamRows=[
    {keys:['biacromial'],label:'Biacromial'},
    {keys:['torax_transverso','torax_transversal'],label:'Tórax transverso'},
    {keys:['torax_anteroposterior','torax_ap'],label:'Tórax anteroposterior'},
    {keys:['biiliocristal','bi_iliocristal'],label:'Biiliocristal'},
    {keys:['umero_biepicondiliano','biepicondiliano_umero','umero'],label:'Úmero biepicondiliano'},
    {keys:['femur_biepicondiliano','biepicondiliano_femur','femur'],label:'Fêmur biepicondiliano'},
    {keys:['punho','estiloide'],label:'Punho'},
    {keys:['tornozelo','maleolar'],label:'Tornozelo'},
  ];
  const diamDisplayItems=diamRows
    .map(r=>{const k=r.keys.find(key=>diam[key]!=null&&diam[key]!==0);return k?[k,r.label] as [string,string]:null;})
    .filter(Boolean) as [string,string][];

  const zonas = atual.cardiorrespiratorio?.zonas;
  const zonaCores=['#22c55e','#10b981','#f59e0b','#f97316','#ef4444'];
  const zonaNomes=['Regenerativo','Base aeróbica','Aeróbico','Limiar','VO₂máx'];
  const zonasItems = Array.isArray(zonas)
    ? zonas.map((z:any,i:number)=>({
      label:z.label??z.nome??`Z${i+1}`,
      nome:zonaNomes[i]??z.nome??`Zona ${i+1}`,
      min:Number(z.min??0),
      max:Number(z.max??0),
      cor:zonaCores[i]??'#10b981',
    }))
    : zonas ? [
      { label: 'Z1', nome: 'Regenerativo', min: zonas.z1?.min ?? 0, max: zonas.z1?.max ?? 0, cor: zonaCores[0] },
      { label: 'Z2', nome: 'Base aeróbica', min: zonas.z2?.min ?? 0, max: zonas.z2?.max ?? 0, cor: zonaCores[1] },
      { label: 'Z3', nome: 'Aeróbico',      min: zonas.z3?.min ?? 0, max: zonas.z3?.max ?? 0, cor: zonaCores[2] },
      { label: 'Z4', nome: 'Limiar',         min: zonas.z4?.min ?? 0, max: zonas.z4?.max ?? 0, cor: zonaCores[3] },
      { label: 'Z5', nome: 'VO₂máx',         min: zonas.z5?.min ?? 0, max: zonas.z5?.max ?? 0, cor: zonaCores[4] },
    ] : [];

  const pri = '#059669';

  return (
    <div style={{display:'flex',flexDirection:'column',gap:20}}>

      {/* ══ CABEÇALHO ══ */}
      <div style={{ order: 0, background: 'linear-gradient(135deg,#052e16 0%,#065f46 50%,#059669 100%)',
        borderRadius: 16, padding: '28px 32px', color: '#ffffff' }}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div style={{ width: 52, height: 52, borderRadius: '50%',
              background: '#f1f5f9', border: '2px solid rgba(255,255,255,.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 700, color: '#0f172a', flexShrink: 0 }}>
              {pacienteNome.slice(0,1).toUpperCase()}
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: -.5 }}>{pacienteNome}</h1>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,.6)', marginTop: 3 }}>
                {pacienteSexo === 'M' ? 'Masculino' : 'Feminino'} · {pacienteNascimento !== '-' ? calcIdade(pacienteNascimento) : '-'} anos
                {avaliadorNome !== '-' && <> · <b style={{ color: '#ffffff' }}>{avaliadorNome}</b></>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {hist.ordenadas.length > 1 && (
              <div style={{ position: 'relative' }}>
                <select
                  value={avaliacaoSel}
                  onChange={e => setAvaliacaoSel(e.target.value)}
                  style={{ appearance: 'none', background: '#f1f5f9',
                    border: '1px solid rgba(255,255,255,.2)', borderRadius: 10,
                    color: '#0f172a', fontSize: 13, padding: '8px 32px 8px 14px',
                    outline: 'none', cursor: 'pointer', minWidth: 200 }}>
                  {hist.ordenadas.slice().reverse().map(a => (
                    <option key={a.id} value={a.id} style={{ background: '#065f46' }}>
                      {new Date(a.data).toLocaleDateString('pt-BR')} · {a.tipo}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} style={{ position: 'absolute', right: 10, top: '50%',
                  transform: 'translateY(-50%)', color: 'rgba(255,255,255,.6)', pointerEvents: 'none' }} />
              </div>
            )}
            {modo === 'clinico' && (
              <EditarPacienteModal paciente={paciente as any} />
            )}
            {modo === 'clinico' && (
              <a href={pdfHref(atual.id)} target="_blank" rel="noreferrer">
                <button style={{ display: 'flex', alignItems: 'center', gap: 6,
                  background: '#f1f5f9', border: '1px solid rgba(255,255,255,.25)',
                  borderRadius: 10, color: '#0f172a', fontSize: 13, fontWeight: 600,
                  padding: '8px 16px', cursor: 'pointer' }}>
                  <FileDown size={14} /> Relatório PDF
                </button>
              </a>
            )}
          </div>
        </div>
      </div>

      {modo === 'clinico' && (
        <div style={{order: 5}}>
          <QuickEditPanel key={atual.id} avaliacao={atual} defaultOpen={quickEditAberto} />
        </div>
      )}

      {/* ══ RESUMO DARK — igual ao PDF ══ */}
      <div style={{ order: 10, background: 'white', borderRadius: 16, padding: '28px 32px', color: '#0f172a' }}>
        {/* Header do card */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          paddingBottom: 18, borderBottom: '1px solid rgba(255,255,255,.08)', marginBottom: 22 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 500, color: '#94a3b8',
              textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 6 }}>
              Resumo da avaliação · {new Date(atual.data).toLocaleDateString('pt-BR')}
            </div>
            {anterior && (
              <div style={{ fontSize: 11, color: '#94a3b8' }}>
                Comparado com {new Date(anterior.data).toLocaleDateString('pt-BR')}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {peso != null && <MetricCard label="kg peso" value={peso} />}
            {mlg  != null && <MetricCard label="kg magra" value={mlg}  color="#4ade80" />}
            {imc  != null && <MetricCard label="IMC"     value={imc}  color="#60a5fa" />}
          </div>
        </div>

        {/* Corpo: gauge global + scores */}
        <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 24, alignItems: 'start' }}>

          {/* Score global */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
            <div style={{ background: '#f8fafc', border: '1px solid #f1f5f9',
              borderRadius: 16, padding: '16px 20px', width: '100%', textAlign: 'center' }}>
              <div style={{ fontSize: 9, fontWeight: 600, color: '#94a3b8',
                textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Score Global</div>
              <GaugeSVG value={sc.global ?? null} label="" size="lg" />
              {anterior?.scores?.global != null && sc.global != null && (
                <div style={{ marginTop: 4, fontSize: 11, color: '#64748b' }}>
                  Anterior: {anterior.scores.global}
                  {sc.global > anterior.scores.global
                    ? <span style={{ color: '#10b981', marginLeft: 6 }}>▲ +{sc.global - anterior.scores.global}</span>
                    : sc.global < anterior.scores.global
                      ? <span style={{ color: '#ef4444', marginLeft: 6 }}>▼ {sc.global - anterior.scores.global}</span>
                      : <span style={{ color: '#6b7280', marginLeft: 6 }}>→</span>}
                </div>
              )}
            </div>

            {/* % Gordura badge */}
            {pctG != null && (
              <div style={{ background: `${gorCor}15`, border: `1px solid ${gorCor}40`,
                borderRadius: 12, padding: '10px 14px', width: '100%', textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: gorCor }}>{pctG}%</div>
                <div style={{ fontSize: 9, color: '#94a3b8', textTransform: 'uppercase',
                  letterSpacing: '.5px', marginTop: 2 }}>Gordura corporal</div>
              </div>
            )}
          </div>

          {/* Barras de scores */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 9, fontWeight: 600, color: '#94a3b8',
              textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>Capacidades avaliadas</div>
            {scoreItems.map(s => (
              <ScoreBar
                key={s.label}
                label={s.label}
                value={s.v ?? null}
                anterior={(anterior?.scores as any)?.[
                  s.label === 'Composição' ? 'composicao_corporal' :
                  s.label === 'Cardio'     ? 'cardiorrespiratorio' :
                  s.label.toLowerCase()
                ] ?? null}
                icon={s.icon}
              />
            ))}
          </div>
        </div>

        {/* Legenda */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 20,
          paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
          {[['#ef4444','Crítico (0–40)'],['#f59e0b','Atenção (41–70)'],['#10b981','Ótimo (71–100)']].map(([c,l]) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 11, color: '#64748b' }}>
              <div style={{ width: 9, height: 9, borderRadius: '50%', background: c }} />
              {l}
            </div>
          ))}
        </div>
      </div>

      {/* ══ EVOLUÇÃO LONGITUDINAL ══ */}
      {hist.ordenadas.length >= 2 && (
        <div style={{display:'flex',flexDirection:'column',gap:20,order:110}}>
          <div style={{ background: 'white', borderRadius: 18, padding: '26px 28px', color: '#0f172a', border:'1px solid #e2e8f0', boxShadow:'0 18px 42px rgba(15,23,42,.05)' }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 20 }}>Evolução dos scores</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: -12, marginBottom: 20 }}>Tendência visual dos principais domínios avaliados</div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {[
                {
                  nome: 'Score Global',
                  pontos: hist.series.scoreGlobal,
                  cor: '#10b981',
                  escopo: 'Integra os módulos disponíveis',
                  leitura: 'Pontuação geral de 0 a 100, não é uma medida corporal isolada.',
                },
                {
                  nome: 'Postura',
                  pontos: hist.series.scorePostura,
                  cor: '#60a5fa',
                  escopo: 'Achados posturais e alinhamento',
                  leitura: 'Score postural 0-100 calculado a partir dos achados da posturografia.',
                },
                {
                  nome: 'Composição',
                  pontos: hist.series.scoreComposicao,
                  cor: '#f59e0b',
                  escopo: 'Gordura, massa magra, IMC e RCQ',
                  leitura: 'Score composto 0-100; os valores brutos ficam em % gordura, kg e medidas corporais.',
                },
                {
                  nome: 'Força',
                  pontos: hist.series.scoreForca,
                  cor: '#a78bfa',
                  escopo: 'Preensão, dinamometria e assimetria',
                  leitura: 'Score de força 0-100; não representa kgf ou kg isoladamente.',
                },
                {
                  nome: 'Cardio',
                  pontos: hist.series.scoreCardio,
                  cor: '#f87171',
                  escopo: 'VO2máx, FC e zonas de treino',
                  leitura: 'Score cardiorrespiratório 0-100; BPM e VO2máx aparecem nos blocos específicos.',
                },
              ].map(({ nome, pontos, cor, escopo, leitura }) => (
                <div key={nome} style={{ background: 'linear-gradient(180deg,#ffffff,#f8fafc)', borderRadius: 16,
                  padding: '18px 20px 14px', border: '1px solid #dbe7ef', boxShadow:'inset 0 1px 0 rgba(255,255,255,.9), 0 12px 28px rgba(15,23,42,.045)' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 900, color: '#475569',
                        textTransform: 'uppercase', letterSpacing: '0.7px' }}>{nome}</div>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 4, lineHeight: 1.35 }}>{escopo}</div>
                    </div>
                    <div style={{ width: 34, height: 6, borderRadius: 999, background: cor, boxShadow:`0 8px 18px ${cor}45` }} />
                  </div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:10 }}>
                    <span style={{ fontSize:10, fontWeight:800, color:'#334155', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:999, padding:'4px 8px' }}>Score 0-100</span>
                    <span style={{ fontSize:10, fontWeight:700, color:'#64748b', background:'#ffffff', border:'1px solid #e2e8f0', borderRadius:999, padding:'4px 8px' }}>Evolução longitudinal</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.45, marginBottom: 8 }}>{leitura}</div>
                  <LineChart yMin={0} yMax={100} series={[{ nome, pontos, cor }]} altura={240} showLabels={false}/>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {[
              { titulo: 'Peso & Massa magra (kg)', series: [
                { nome: 'Peso', pontos: hist.series.peso, cor: '#60a5fa' },
                { nome: 'Massa magra', pontos: hist.series.massaMagra, cor: '#4ade80' },
              ], unidade: 'kg' },
              { titulo: '% Gordura', series: [
                { nome: '% Gordura', pontos: hist.series.pctGordura, cor: '#f59e0b' },
              ], unidade: '%' },
              { titulo: 'VO₂máx (ml/kg/min)', series: [
                { nome: 'VO₂máx', pontos: hist.series.vo2max, cor: '#f87171' },
              ], unidade: 'ml/kg/min' },
              { titulo: 'Preensão palmar (kgf)', series: [
                { nome: 'Direita', pontos: hist.series.preensaoDir, cor: '#60a5fa' },
                { nome: 'Esquerda', pontos: hist.series.preensaoEsq, cor: '#a78bfa' },
              ], unidade: 'kgf' },
            ].map(({ titulo, series, unidade }) => (
              <div key={titulo} style={{ background: 'linear-gradient(180deg,#ffffff,#f8fafc)', borderRadius: 18,
                padding: '22px 24px 16px', color: '#0f172a', border:'1px solid #e2e8f0', boxShadow:'0 16px 34px rgba(15,23,42,.045)' }}>
                <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,marginBottom:14 }}>
                  <div style={{ fontSize: 14, fontWeight: 900 }}>{titulo}</div>
                  <div style={{ display:'flex', gap:5 }}>
                    {series.map((s:any)=><span key={s.nome} style={{width:8,height:8,borderRadius:'50%',background:s.cor,boxShadow:`0 5px 12px ${s.cor}55`}} />)}
                  </div>
                </div>
                <LineChart unidade={unidade} series={series} altura={250} showLabels={false}/>
              </div>
            ))}
          </div>

          {/* Comparativo */}
          <div style={{background:'white',border:'1px solid #e2e8f0',borderRadius:16,padding:'22px 24px'}}>
            <div style={{fontSize:15,fontWeight:900,color:'#0f172a',marginBottom:4}}>Comparativo: atual vs. anterior</div>
            <div style={{fontSize:12,color:'#94a3b8',marginBottom:16}}>Principais marcadores da avaliação selecionada</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:10}}>
              <CompRow label="Peso"        atual={atual.antropometria?.peso}                  anterior={anterior?.antropometria?.peso}                  unidade=" kg"        direcao="descer_bom" />
              <CompRow label="% Gordura"   atual={atual.antropometria?.percentual_gordura}     anterior={anterior?.antropometria?.percentual_gordura}     unidade="%"          direcao="descer_bom" />
              <CompRow label="Massa magra" atual={atual.antropometria?.massa_magra}            anterior={anterior?.antropometria?.massa_magra}            unidade=" kg"        direcao="subir_bom" />
              <CompRow label="IMC"         atual={atual.antropometria?.imc}                   anterior={anterior?.antropometria?.imc}                   unidade=""           direcao="descer_bom" />
              <CompRow label="VO₂máx"      atual={atual.cardiorrespiratorio?.vo2max}           anterior={anterior?.cardiorrespiratorio?.vo2max}           unidade=" ml/kg/min" direcao="subir_bom" />
              <CompRow label="Preensão D"  atual={atual.forca?.preensao_dir_kgf}              anterior={anterior?.forca?.preensao_dir_kgf}              unidade=" kgf"       direcao="subir_bom" />
              <CompRow label="Preensão E"  atual={atual.forca?.preensao_esq_kgf}              anterior={anterior?.forca?.preensao_esq_kgf}              unidade=" kgf"       direcao="subir_bom" />
              <CompRow label="Score"       atual={atual.scores?.global}                       anterior={anterior?.scores?.global}                       unidade=""           direcao="subir_bom" casas={0} />
            </div>
          </div>
        </div>
      )}

      {/* ══ MÓDULOS ADICIONAIS — Sinais Vitais, Flexibilidade, Posturografia ══ */}
      {(() => {
        const sv   = atual.sinais_vitais as any;
        const flex = atual.flexibilidade as any;
        const post = atual.posturografia as any;
        const anam = atual.anamnese as any;
        if (!sv && !flex && !post && !anam) return null;

        const corFlex = flex?.classificacao === 'Excelente' ? '#16a34a'
          : flex?.classificacao === 'Bom' ? '#10b981'
          : flex?.classificacao === 'Médio' ? '#f59e0b'
          : flex?.classificacao === 'Regular' ? '#f97316' : '#ef4444';

        return (
          <div style={{display:'contents'}}>

            {/* Anamnese */}
            {anam && (
              <div style={{ order: 20, background: 'white', borderRadius: 14, padding: '18px 20px', color: '#0f172a' }}>
                <div style={{ fontSize: 9, fontWeight: 600, color: '#94a3b8',
                  textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>
                  Anamnese
                  <span style={{marginLeft:8}}><AnaliseInfoTooltip texto={textoAnaliseClinica(atual.analises_ia?.anamnese)} /></span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 10 }}>
                  {Object.entries(cleanModulo(anam)).filter(([,v]) => v != null && v !== '').slice(0, 8).map(([k,v]) => (
                    <PreviewMetricLine key={k} label={humanField(k)} value={v} />
                  ))}
                </div>
              </div>
            )}

            {/* Sinais Vitais */}
            {sv && (
              <div style={{ order: 21, background: 'white', borderRadius: 14, padding: '18px 20px', color: '#0f172a' }}>
                <div style={{ fontSize: 9, fontWeight: 600, color: '#94a3b8',
                  textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>
                  ❤️ Sinais Vitais
                  <span style={{marginLeft:8}}><AnaliseInfoTooltip texto={textoAnaliseClinica(atual.analises_ia?.sinais_vitais)} /></span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 10 }}>
                  {sv.pa_sistolica != null && sv.pa_diastolica != null && (
                    <div style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 12px' }}>
                      <div style={{ fontSize: 8, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 3 }}>Pressão arterial</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>{sv.pa_sistolica}/{sv.pa_diastolica}</div>
                      <div style={{ fontSize: 9, color: '#94a3b8' }}>mmHg</div>
                    </div>
                  )}
                  {sv.fc_repouso != null && (
                    <div style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 12px' }}>
                      <div style={{ fontSize: 8, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 3 }}>FC repouso</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#f87171' }}>{sv.fc_repouso}</div>
                      <div style={{ fontSize: 9, color: '#94a3b8' }}>bpm</div>
                    </div>
                  )}
                  {sv.spo2 != null && (
                    <div style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 12px' }}>
                      <div style={{ fontSize: 8, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 3 }}>SpO₂</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#60a5fa' }}>{sv.spo2}</div>
                      <div style={{ fontSize: 9, color: '#94a3b8' }}>%</div>
                    </div>
                  )}
                  {sv.freq_respiratoria != null && sv.freq_respiratoria !== '' && (
                    <div style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 12px' }}>
                      <div style={{ fontSize: 8, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 3 }}>Freq. resp.</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#a78bfa' }}>{sv.freq_respiratoria}</div>
                      <div style={{ fontSize: 9, color: '#94a3b8' }}>irpm</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Flexibilidade */}
            {flex && (
              <div style={{ order: 60, background: 'white', borderRadius: 16, padding: '24px 28px', color: '#0f172a', border:'1px solid #e2e8f0' }}>
                <div style={{ display:'flex',alignItems:'center',gap:8,fontSize: 18, fontWeight: 900, color:'#0f172a', marginBottom: 4 }}>Flexibilidade <AnaliseInfoTooltip texto={textoAnaliseClinica(atual.analises_ia?.flexibilidade)} /></div>
                <div style={{ fontSize: 12, color:'#94a3b8', marginBottom: 16 }}>Banco de Wells - Sit and Reach</div>
                <div style={{display:'flex',alignItems:'center',gap:24,flexWrap:'wrap'}}>
                  <div style={{textAlign:'center',flexShrink:0,paddingRight:18,borderRight:'1px solid #f1f5f9'}}>
                    <div style={{fontSize:44,fontWeight:800,color:corFlex,lineHeight:1}}>{flex.melhor_resultado ?? '-'}</div>
                    <div style={{fontSize:12,color:'#94a3b8',marginTop:2}}>cm</div>
                    <div style={{display:'inline-block',marginTop:8,padding:'3px 14px',borderRadius:100,fontSize:11,fontWeight:700,background:`${corFlex}15`,color:corFlex,border:`1px solid ${corFlex}30`}}>
                      {flex.classificacao ?? '-'}
                    </div>
                  </div>
                  {flex.tentativa_1 != null && (
                    <div style={{flex:1,display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))',gap:10,minWidth:260}}>
                      {[flex.tentativa_1, flex.tentativa_2, flex.tentativa_3].filter(Boolean).map((v, i) => (
                        <MetricLine key={i} label={`Tentativa ${i+1}`} value={v} unit="cm"/>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Posturografia */}
            {post && (
              <div style={{ order: 30, background: 'white', borderRadius: 14, padding: '18px 20px', color: '#0f172a' }}>
                <div style={{ fontSize: 9, fontWeight: 600, color: '#94a3b8',
                  textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>
                  🧍 Posturografia
                  <span style={{marginLeft:8}}><AnaliseInfoTooltip texto={textoAnaliseClinica(atual.analises_ia?.posturografia)} /></span>
                </div>
                {/* Fotos de posturografia — somente no modo clínico */}
                {modo === 'clinico' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 10, marginBottom: 12 }}>
                    {[
                      [post.foto_anterior,    'Anterior'],
                      [post.foto_posterior,   'Posterior'],
                      [post.foto_lateral_dir, 'Lateral direita'],
                      [post.foto_lateral_esq, 'Lateral esquerda'],
                    ].map(([url, lbl]: any) => (
                      <div key={lbl} style={{ textAlign: 'center', border:'1px solid #e2e8f0', borderRadius:12, overflow:'hidden', background:'#f8fafc' }}>
                        <div style={{ width:'100%', aspectRatio:'3 / 4', display:'flex', alignItems:'center', justifyContent:'center', background:'#f1f5f9' }}>
                          {url ? (
                            <img src={url} alt={lbl}
                              style={{ width: '100%', height: '100%', objectFit: 'contain', display:'block' }} />
                          ) : (
                            <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:8,color:'#94a3b8'}}>
                              <Camera size={28}/>
                              <span style={{fontSize:9,fontWeight:900,textTransform:'uppercase',letterSpacing:'.6px'}}>Foto</span>
                            </div>
                          )}
                        </div>
                        <div style={{ fontSize: 10, fontWeight:800, color: '#475569', padding:'7px 6px' }}>{lbl}</div>
                      </div>
                    ))}
                  </div>
                )}
                {(() => {
                  const alin = post.alinhamentos ?? {};
                  const desv = Object.entries(alin)
                    .filter(([,v]) => v)
                    .map(([k]) => k.replace(/_/g,' '));
                  return (
                    <>
                      {desv.length === 0 ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8,
                          padding: '10px 14px', background: 'rgba(16,185,129,.1)',
                          borderRadius: 10, border: '1px solid rgba(16,185,129,.2)' }}>
                          <span style={{ fontSize: 16 }}>✓</span>
                          <span style={{ fontSize: 12, color: '#10b981', fontWeight: 600 }}>
                            Sem desvios relevantes
                          </span>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {desv.map((d, i) => (
                            <span key={i} style={{ fontSize: 10, padding: '3px 10px',
                              borderRadius: 20, background: 'rgba(239,68,68,.15)',
                              color: '#fca5a5', border: '1px solid rgba(239,68,68,.2)',
                              textTransform: 'capitalize' }}>
                              {d}
                            </span>
                          ))}
                        </div>
                      )}
                      {sc.postura != null && (
                        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center',
                          justifyContent: 'flex-start', gap: 8 }}>
                          <span style={{ fontSize: 10, color: '#94a3b8' }}>Score postura</span>
                          <span style={{ fontSize: 16, fontWeight: 800,
                            color: zoneColor(sc.postura) }}>{sc.postura}</span>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        );
      })()}

      {atual.bioimpedancia && (() => {
        const bio = atual.bioimpedancia as any;
        const segMagra = bio.segmentar_massa_magra ?? bio.segmentar_magra ?? {};
        const itens = [
          ['Peso', bio.peso_kg, 'kg', '#0f172a'],
          ['Altura', bio.altura_cm, 'cm', '#0f172a'],
          ['IMC', bio.imc, '', '#0f172a'],
          ['Gordura corporal', bio.percentual_gordura, '%', '#f59e0b'],
          ['Massa livre de gordura', bio.massa_livre_gordura_kg, 'kg', '#10b981'],
          ['Massa muscular', bio.massa_muscular_kg, 'kg', '#10b981'],
          ['Agua corporal', bio.agua_corporal_pct ?? bio.agua_corporal_kg, bio.agua_corporal_pct != null ? '%' : 'kg', '#0f172a'],
          ['Metabolismo basal', bio.taxa_metabolica_basal_kcal, 'kcal', '#7c3aed'],
          ['Gordura visceral', bio.gordura_visceral_nivel ?? bio.gordura_visceral, '', '#f97316'],
        ].filter(([,v]) => v != null && v !== '');
        const segEntries = Object.entries(segMagra).filter(([,v]) => v != null && v !== '');
        if (!itens.length && !segEntries.length) return null;
        return (
          <div style={{order:45, background:'white', border:'1px solid #e2e8f0', borderRadius:16, padding:'24px 28px', color:'#0f172a'}}>
            <div style={{display:'flex', alignItems:'center', gap:8, fontSize:18, fontWeight:900, marginBottom:4}}>
              Bioimpedância <AnaliseInfoTooltip texto={textoAnaliseClinica(atual.analises_ia?.bioimpedancia)} />
            </div>
            <div style={{fontSize:12, color:'#94a3b8', marginBottom:16}}>Composição corporal e dados metabólicos</div>
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))', gap:8}}>
              {itens.map(([l,v,u,c]: any) => <MetricLine key={l} label={l} value={v} unit={u} color={c}/>)}
            </div>
            {segEntries.length > 0 && (
              <div style={{marginTop:14}}>
                <div style={{fontSize:11, fontWeight:800, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.6px', marginBottom:8}}>Massa magra segmentar</div>
                <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:8}}>
                  {segEntries.map(([k,v]: any) => {
                    const valor = typeof v === 'object' && v
                      ? [v.kg != null ? `${v.kg} kg` : null, v.pct != null ? `${v.pct}%` : null].filter(Boolean).join(' · ')
                      : v;
                    return <MetricLine key={k} label={humanField(k)} value={valor} />;
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {atual.antropometria && (() => {
        const a = atual.antropometria as any;
        const dobras = a.dobras ?? {};
        const somaDobras = Object.values(dobras).reduce((acc: number, v: any) => acc + (Number(v) || 0), 0);
        const itens = [
          ['Peso', a.peso, 'kg', '#0f172a'],
          ['Estatura', a.estatura, 'cm', '#0f172a'],
          ['IMC', a.imc, '', '#0f172a'],
          ['Gordura corporal', a.percentual_gordura, '%', '#f59e0b'],
          ['Massa magra', a.massa_magra, 'kg', '#10b981'],
          ['Massa ossea', a.massa_ossea, 'kg', '#0f172a'],
          ['RCQ', a.rcq, '', '#0f172a'],
          ['Soma de dobras', somaDobras || null, 'mm', '#0f172a'],
        ].filter(([,v]) => v != null && v !== '');
        if (!itens.length && !Object.keys(dobras).length) return null;
        return (
          <div style={{order:55, background:'white', border:'1px solid #e2e8f0', borderRadius:16, padding:'24px 28px', color:'#0f172a'}}>
            <div style={{display:'flex', alignItems:'center', gap:8, fontSize:18, fontWeight:900, marginBottom:4}}>
              Antropometria <AnaliseInfoTooltip texto={textoAnaliseClinica(atual.analises_ia?.antropometria)} />
            </div>
            <div style={{fontSize:12, color:'#94a3b8', marginBottom:16}}>Medidas ISAK, dobras cutâneas e composição corporal</div>
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))', gap:8}}>
              {itens.map(([l,v,u,c]: any) => <MetricLine key={l} label={l} value={v} unit={u} color={c}/>)}
            </div>
            {Object.keys(dobras).length > 0 && (
              <div style={{marginTop:14}}>
                <div style={{fontSize:11, fontWeight:800, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.6px', marginBottom:8}}>Dobras cutâneas</div>
                <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:8}}>
                  {Object.entries(dobras).filter(([,v]) => v != null && v !== '').map(([k,v]) => <MetricLine key={k} label={humanField(k)} value={v} unit="mm"/>)}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {atual.forca && (() => {
        const f = atual.forca as any;
        const itens = [
          ['Preensao direita', f.preensao_dir_kgf, 'kgf', '#0f172a'],
          ['Preensao esquerda', f.preensao_esq_kgf, 'kgf', '#0f172a'],
          ['Forca relativa direita', f.forca_relativa_dir, 'kgf/kg', '#0f172a'],
          ['Forca relativa esquerda', f.forca_relativa_esq, 'kgf/kg', '#0f172a'],
          ['Assimetria', f.assimetria_percent, '%', '#f59e0b'],
          ['Modelo dinamometria', f.modelo_dinamometria, '', '#0f172a'],
        ].filter(([,v]) => v != null && v !== '');
        if (!itens.length) return null;
        return (
          <div style={{order:69, background:'white', border:'1px solid #e2e8f0', borderRadius:16, padding:'24px 28px', color:'#0f172a'}}>
            <div style={{display:'flex', alignItems:'center', gap:8, fontSize:18, fontWeight:900, marginBottom:4}}>
              Força muscular <AnaliseInfoTooltip texto={textoAnaliseClinica(atual.analises_ia?.forca)} />
            </div>
            <div style={{fontSize:12, color:'#94a3b8', marginBottom:16}}>Preensão palmar, força relativa e assimetria</div>
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))', gap:8}}>
              {itens.map(([l,v,u,c]: any) => <MetricLine key={l} label={l} value={v} unit={u} color={c}/>)}
            </div>
          </div>
        );
      })()}

      {/* ══ ALERTA SARCOPENIA (EWGSOP2) ══ */}
      {modo === 'clinico' && (() => {
        const f = (atual as any).forca;
        const preensao = Math.max(f?.preensao_dir_kgf ?? 0, f?.preensao_esq_kgf ?? 0);
        const panturrilha = (atual as any).antropometria?.circunferencias?.panturrilha;
        const sexo = paciente.sexo;
        if (!preensao || !panturrilha) return null;
        const limitePreensao = sexo === 'M' ? 27 : 16;
        const alertaPreensao = preensao < limitePreensao;
        const alertaPanturrilha = panturrilha < 31;
        if (!alertaPreensao && !alertaPanturrilha) return null;
        const provavel = alertaPreensao && alertaPanturrilha;
        return (
          <div style={{
            order: 72,
            background: provavel ? '#fef2f2' : '#fffbeb',
            border: `1px solid ${provavel ? '#fca5a5' : '#fde68a'}`,
            borderRadius: 12, padding: '14px 18px', display: 'flex', gap: 12, alignItems: 'flex-start',
          }}>
            <span style={{ fontSize: 20, flexShrink: 0 }}>{provavel ? '🚨' : '⚠️'}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: provavel ? '#991b1b' : '#92400e', marginBottom: 4 }}>
                {provavel ? 'Provável sarcopenia (EWGSOP2)' : 'Risco de sarcopenia — monitorar'}
              </div>
              <div style={{ fontSize: 12, color: provavel ? '#7f1d1d' : '#78350f', lineHeight: 1.6 }}>
                {alertaPreensao && <span>Preensão palmar {preensao.toFixed(1)} kgf (limiar: {limitePreensao} kgf) · </span>}
                {alertaPanturrilha && <span>Circunferência de panturrilha {panturrilha} cm (limiar: 31 cm)</span>}
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                Critérios EWGSOP2 · Recomenda-se avaliação funcional complementar
              </div>
            </div>
          </div>
        );
      })()}

      {/* ══ DINAMOMETRIA SP TECH ══ */}
      {((atual as any)?.forca?.sptech_testes?.length > 0 || (atual as any)?.forca?.tracao_testes?.length > 0) && (() => {
        const spT: any[] = (atual as any).forca.sptech_testes ?? [];
        const trT: any[] = (atual as any).forca.tracao_testes ?? [];
        const spR: any[] = ((atual as any).forca.sptech_relacoes ?? [])
          .map((r:any)=>({
            descricao:r.descricao??r.nome??r.label,
            percentual:r.percentual??r.valor,
            unidade:r.unidade??'%',
          }))
          .filter((r:any)=>r.descricao&&r.percentual!=null&&r.percentual!=='');
        const alg: any[] = (atual as any).forca.algometria ?? [];
        const temAlg = (atual as any).forca.tem_algometria && alg.length > 0;
        const corA = (c: string) => c === 'Leve' ? '#10b981' : c === 'Moderada' ? '#f59e0b' : '#ef4444';

        return (
          <div style={{ order: 70, background: 'white', borderRadius: 16, padding: '24px 28px', color: '#0f172a' }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Dinamometria isométrica manual</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 20 }}>
              Força máxima isométrica por articulação, movimento e modelo de aparelho
            </div>

            {/* Relações musculares */}
            {spR.length > 0 && (
              <div style={{ marginBottom: 16, padding: '10px 14px',
                background: '#f8fafc', borderRadius: 10,
                border: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: 9, fontWeight: 600, color: '#94a3b8',
                  textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Relações musculares</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {spR.map((r: any, i: number) => (
                    <div key={i} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 100,
                      background: 'rgba(255,255,255,.08)', color: '#334155',
                      border: '1px solid #e2e8f0' }}>
                      {r.descricao}: <b style={{ color: '#0f172a' }}>{r.percentual}{r.unidade??'%'}</b>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Testes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {spT.map((t: any, i: number) => {
                const artNome = t.articulacao === 'Outra' ? (t.nome_outra||'Outra') : t.articulacao;
                const movNome = t.articulacao === 'Outra' ? (t.movimento_outra||'—') : t.movimento;
                const isAxial = ['Coluna','Cervical','Lombar'].includes(t.articulacao);
                const isBilat = t.articulacao === 'Outra' ? t.lateralidade === 'bilateral' : !isAxial;
                const cor = corA(t.classificacao_assimetria);

                const LadoCard = ({ lado, titulo, acento }: { lado: any; titulo: string; acento: string }) => {
                  if (!lado?.kgf && !lado?.torque_nm) return null;
                  return (
                    <div style={{ flex: 1, padding: '10px 12px',
                      background: '#f8fafc', borderRadius: 10,
                      border: `1px solid ${acento}30` }}>
                      <div style={{ fontSize: 9, fontWeight: 600, color: acento,
                        textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>{titulo}</div>
                      <div style={{ display: 'flex', gap: 14, alignItems: 'baseline' }}>
                        {lado.kgf && <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>
                          {lado.kgf}<span style={{ fontSize: 10, fontWeight: 400, color: '#94a3b8', marginLeft: 2 }}>kgf</span>
                        </div>}
                        {lado.torque_nm && <div style={{ fontSize: 16, fontWeight: 700, color: '#334155' }}>
                          {lado.torque_nm}<span style={{ fontSize: 10, fontWeight: 400, color: '#94a3b8', marginLeft: 2 }}>Nm</span>
                        </div>}
                        {lado.rm1_kg && <div style={{ fontSize: 13, color: '#64748b' }}>
                          1RM: {lado.rm1_kg}kg
                        </div>}
                      </div>
                      {lado.cargas && Object.values(lado.cargas).some(Boolean) && (
                        <div style={{ marginTop: 8, paddingTop: 8,
                          borderTop: '1px solid rgba(255,255,255,.06)',
                          display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                          {[['Resistência','resistencia'],['Força','forca'],
                            ['Potência','potencia'],['Hipertrofia','hipertrofia'],['Velocidade','velocidade']
                          ].map(([lbl,k]) => {
                            const mn = lado.cargas[`${k}_min`], mx = lado.cargas[`${k}_max`];
                            if (!mn && !mx) return null;
                            return (
                              <span key={k} style={{ fontSize: 9, padding: '2px 7px', borderRadius: 100,
                                background: 'rgba(255,255,255,.07)', color: '#64748b',
                                border: '1px solid #e2e8f0' }}>
                                {lbl}: {mn}{mn&&mx?'–':''}{mx?`${mx}kg`:''}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                };

                return (
                  <div key={i} style={{ border: '1px solid #e2e8f0',
                    borderRadius: 12, overflow: 'hidden' }}>
                    <div style={{ padding: '10px 14px',
                      background: '#f8fafc', borderBottom: '1px solid #f1f5f9',
                      display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                        {artNome} — {movNome}
                      </span>
                      {t.assimetria_pct && isBilat && (
                        <span style={{ fontSize: 10, padding: '2px 10px', borderRadius: 100,
                          fontWeight: 600, background: `${cor}20`, color: cor,
                          border: `1px solid ${cor}40` }}>
                          Assimetria {t.assimetria_pct}% · {t.classificacao_assimetria}
                        </span>
                      )}
                    </div>
                    <div style={{ padding: 10, display: 'flex', gap: 10 }}>
                      {isBilat ? (
                        <>
                          <LadoCard lado={t.lado_d} titulo="◀ Lado Direito" acento="#3b82f6"/>
                          <LadoCard lado={t.lado_e} titulo="Lado Esquerdo ▶" acento="#8b5cf6"/>
                        </>
                      ) : (
                        <LadoCard
                          lado={isAxial || t.lateralidade !== 'esquerdo' ? t.lado_d : t.lado_e}
                          titulo={isAxial ? 'Resultado' : t.lateralidade === 'esquerdo' ? 'Lado Esquerdo' : 'Lado Direito'}
                          acento="#6b7280"
                        />
                      )}
                    </div>
                  </div>
                );
              })}
              {trT.map((t: any, i: number) => {
                const cor = corA(t.classificacao_assimetria);
                const LadoCard = ({ lado, titulo, acento }: { lado: any; titulo: string; acento: string }) => {
                  if (!lado?.fim_kgf && !lado?.rm1_kg && !lado?.rfd_kgf_s) return null;
                  return (
                    <div style={{ flex: 1, padding: '10px 12px', background: '#f8fafc',
                      borderRadius: 10, border: `1px solid ${acento}30` }}>
                      <div style={{ fontSize: 9, fontWeight: 600, color: acento,
                        textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>{titulo}</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 8 }}>
                        {[
                          ['FIM', lado.fim_kgf, 'kgf'],
                          ['1RM estimado', lado.rm1_kg, 'kg'],
                          ['RFD', lado.rfd_kgf_s, 'kgf/s'],
                        ].map(([label, valor, un]) => (
                          <div key={label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 10px' }}>
                            <div style={{ fontSize: 8, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.6px', fontWeight: 700 }}>{label}</div>
                            <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
                              {valor || '—'} <span style={{ fontSize: 9, color: '#94a3b8', fontWeight: 500 }}>{un}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                };
                return (
                  <div key={`tracao-${i}`} style={{ border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
                    <div style={{ padding: '10px 14px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9',
                      display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                        {t.musculo || `Teste de tração ${i+1}`}
                      </span>
                      {t.exercicio_ref && <span style={{ fontSize: 11, color: '#64748b' }}>{t.exercicio_ref}</span>}
                      {t.fator && <span style={{ fontSize: 10, padding: '2px 10px', borderRadius: 100,
                        fontWeight: 600, background: '#eef2ff', color: '#4338ca', border: '1px solid #c7d2fe' }}>Fator {t.fator}</span>}
                      {t.assimetria_pct && <span style={{ fontSize: 10, padding: '2px 10px', borderRadius: 100,
                        fontWeight: 600, background: `${cor}20`, color: cor, border: `1px solid ${cor}40` }}>
                        Assimetria {t.assimetria_pct}% · {t.classificacao_assimetria}
                      </span>}
                    </div>
                    <div style={{ padding: 10, display: 'flex', gap: 10 }}>
                      <LadoCard lado={t.lado_d} titulo="◀ Lado Direito" acento="#3b82f6"/>
                      <LadoCard lado={t.lado_e} titulo="Lado Esquerdo ▶" acento="#8b5cf6"/>
                    </div>
                    {t.observacoes && (
                      <div style={{ padding: '0 12px 12px', fontSize: 12, color: '#475569' }}>{t.observacoes}</div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Algometria */}
            {temAlg && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#334155',
                  marginBottom: 10 }}>Algometria — Limiar de dor à pressão (PPT)</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {alg.map((p: any, i: number) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12,
                      padding: '8px 12px', background: '#f8fafc',
                      borderRadius: 8, border: '1px solid #f1f5f9' }}>
                      <span style={{ flex: 1, fontSize: 12, color: '#1e293b', fontWeight: 500 }}>
                        {p.segmento}
                        {p.lado !== 'sem_lado' && (
                          <span style={{ fontSize: 10, color: '#94a3b8', marginLeft: 6 }}>
                            ({p.lado === 'direito' ? 'D' : 'E'})
                          </span>
                        )}
                      </span>
                      <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                        {p.valor_kgf}
                        <span style={{ fontSize: 10, fontWeight: 400, color: '#94a3b8', marginLeft: 2 }}>kgf</span>
                      </span>
                      {p.observacao && (
                        <span style={{ fontSize: 10, color: '#94a3b8' }}>{p.observacao}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* ══ SILHUETA + CIRCUNFERÊNCIAS + ZONAS ══ */}
      {(pctG != null || circItems.length > 0 || zonasItems.length > 0) && (
        <div style={{display:'contents'}}>
          {/* Silhueta com circunferências anotadas — aparece sempre que tiver pctG ou circunferências */}
          {(pctG != null || circItems.length > 0) && (
            <div style={{ order: 40, background: 'white', borderRadius: 16, padding: '24px 28px', color: '#0f172a' }}>
              <SilhuetaCircunferencias
                sexo={pacienteSexo}
                circunferencias={{}}
                pctGorduraTotal={pctG ?? null}
                peso={peso ?? null}
                altura={altura ?? null}
                massaMagra={mlg ?? null}
                imc={imc ?? null}
                massaOssea={massaOssea ?? null}
                ffmi={null}
                rcq={atual.antropometria?.rcq ?? null}
                somatotipo={atual.antropometria?.somatotipo ?? null}
                agua_corporal={(atual as any).bioimpedancia?.agua_corporal_pct
                  ?? (atual as any).bioimpedancia?.agua_corporal_kg ?? null}
                metabolismo_basal={(atual as any).bioimpedancia?.taxa_metabolica_basal_kcal
                  ?? null}
                gordura_visceral={(atual as any).bioimpedancia?.gordura_visceral_nivel
                  ?? (atual as any).bioimpedancia?.gordura_visceral ?? null}
                segmentar_gordura={(atual as any).bioimpedancia?.segmentar_gordura ?? null}
              />
            </div>
          )}
          {/* Zonas de treinamento */}
          {zonasItems.length > 0 && (
            <div style={{ order: 91, background: 'white', borderRadius: 16, padding: '20px 24px', color: '#0f172a' }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Zonas de treinamento (FC máx.)</div>
              <ZonasChart zonas={zonasItems} />
            </div>
          )}
        </div>
      )}

      {(ffmiValor != null || mlg != null) && (
        <div style={{order: 50}}>
          <FfmiCard ffmi={ffmiValor ?? null} massaMagra={mlg ?? null} massaOssea={massaOssea ?? null}
            peso={peso ?? null} altura={altura ?? null} sexo={pacienteSexo}/>
        </div>
      )}

      {circDisplayItems.length > 0 && (
        <div style={{order: 52, background:'white',border:'1px solid #e2e8f0',borderRadius:16,padding:'24px 28px',color:'#0f172a'}}>
          <div style={{fontSize:18,fontWeight:900,marginBottom:4}}>Circunferências corporais</div>
          <div style={{fontSize:12,color:'#94a3b8',marginBottom:16}}>Medidas organizadas de cima para baixo no corpo</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:8}}>
            {circDisplayItems.map(([k,l])=><MetricLine key={k} label={l} value={circ[k]} unit="cm"/>)}
          </div>
        </div>
      )}

      {diamDisplayItems.length > 0 && (
        <div style={{order: 53, background:'white',border:'1px solid #e2e8f0',borderRadius:16,padding:'24px 28px',color:'#0f172a'}}>
          <div style={{fontSize:18,fontWeight:900,marginBottom:4}}>Diâmetros ósseos</div>
          <div style={{fontSize:12,color:'#94a3b8',marginBottom:16}}>Medidas antropométricas de referência ISAK</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:8}}>
            {diamDisplayItems.map(([k,l])=><MetricLine key={k} label={l} value={diam[k]} unit="cm"/>)}
          </div>
        </div>
      )}

      {/* ══ RML — RESISTÊNCIA MUSCULAR LOCALIZADA ══ */}
      {atual.cardiorrespiratorio && (() => {
        const cardio = atual.cardiorrespiratorio as any;
        const sv = atual.sinais_vitais as any;
        const itens = [
          ['VO2max', cardio.vo2max, 'ml/kg/min', '#10b981'],
          ['Classificacao', cardio.classificacao_vo2, '', '#0f172a'],
          ['FC limiar', cardio.fc_limiar, 'bpm', '#f59e0b'],
          ['FC maxima', cardio.fc_max, 'bpm', '#f87171'],
          ['Pressao arterial', sv?.pa_sistolica != null && sv?.pa_diastolica != null ? `${sv.pa_sistolica}/${sv.pa_diastolica}` : null, 'mmHg', '#0f172a'],
          ['FC repouso', sv?.fc_repouso, 'bpm', '#0f172a'],
          ['SpO2', sv?.spo2 != null ? `${sv.spo2}%` : null, '', '#0f172a'],
        ].filter(([,v]) => v != null && v !== '');
        if (!itens.length && !cardio.protocolo) return null;
        return (
          <div style={{order: 90, background:'white',border:'1px solid #e2e8f0',borderRadius:16,padding:'24px 28px',color:'#0f172a'}}>
            <div style={{display:'flex',alignItems:'center',gap:8,fontSize:18,fontWeight:900,marginBottom:4}}>Saude cardiovascular <AnaliseInfoTooltip texto={textoAnaliseClinica(atual.analises_ia?.cardiorrespiratorio)} /></div>
            <div style={{fontSize:12,color:'#94a3b8',marginBottom:16}}>Capacidade aerobica, sinais vitais e zonas de treinamento</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:8}}>
              {itens.map(([l,v,u,c]: any) => <MetricLine key={l} label={l} value={v} unit={u} color={c}/>)}
            </div>
            {cardio.protocolo && <div style={{marginTop:10}}><MetricLine label="Protocolo" value={cardio.protocolo}/></div>}
          </div>
        );
      })()}

      {(atual as any)?.rml && (() => {
        const rml = (atual as any).rml as any;
        const cat: string = rml.categoria ?? 'jovem_ativo';
        const COR: Record<string,string> = {
          'Excelente':'#10b981','Bom':'#3b82f6','Regular':'#f59e0b',
          'Fraco':'#f97316','Muito fraco':'#ef4444',
        };

        // Montar lista de testes conforme categoria
        const testes = cat === 'jovem_ativo' ? [
          { lbl: rml.mmss_modalidade === 'modificada' ? 'Flexão modificada' : 'Flexão tradicional', val: rml.mmss_reps, unit:'reps', cls: rml.mmss_classificacao },
          { lbl: 'Abdominal 1 min', val: rml.abd_1min_reps, unit:'reps', cls: rml.abd_1min_classificacao },
          { lbl: 'Prancha ventral',  val: rml.abd_prancha_seg, unit:'seg', cls: rml.abd_prancha_classificacao },
          { lbl: 'Agachamento 1 min',val: rml.mmii_agach_reps, unit:'reps', cls: rml.mmii_agach_classificacao },
          ...(rml.mmii_wallsit_seg != null ? [{ lbl: 'Wall sit', val: rml.mmii_wallsit_seg, unit:'seg', cls: rml.mmii_wallsit_classificacao }] : []),
        ] : [
          { lbl: 'Sentar e Levantar 30s', val: rml.idoso_sl_reps, unit:'reps', cls: rml.idoso_sl_classificacao },
          { lbl: 'Arm Curl Test 30s',     val: rml.idoso_armcurl_reps, unit:'reps', cls: rml.idoso_armcurl_classificacao },
        ];

        const ativos = testes.filter(t => t.val != null);
        const analiseRml = textoAnaliseClinica(atual.analises_ia?.rml);

        return (
          <div style={{ order: 80, background: 'white', borderRadius: 16, padding: '24px 28px', marginBottom: 16, border: '1px solid #e2e8f0' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:8, fontSize: 18, fontWeight: 900, color: '#0f172a' }}>
                  Resistência Muscular (RML)
                  <AnaliseInfoTooltip texto={analiseRml} />
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                  {cat === 'jovem_ativo' ? 'Jovem / Ativo' : 'Idoso (≥ 60 anos)'}
                </div>
              </div>
              {sc.rml != null && (
                <div style={{ textAlign: 'center', padding: '9px 18px', background: '#f8fafc', border: '1px solid #d1fae5', borderRadius: 14 }}>
                  <div style={{ fontSize: 28, fontWeight: 950, color: '#10b981', lineHeight: 1 }}>{sc.rml}</div>
                  <div style={{ fontSize: 9, color: '#059669', textTransform: 'uppercase', letterSpacing: 1, marginTop: 3, fontWeight:800 }}>Score</div>
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 10, marginBottom: 16 }}>
              {ativos.map((t, i) => {
                const cor = t.cls ? (COR[t.cls] ?? '#6b7280') : '#6b7280';
                return (
                  <div key={i} style={{ display: 'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:7, minHeight:104, padding:'14px 16px', border:`1px solid ${cor}35`, borderRadius:14, background:'#f8fafc', textAlign:'center' }}>
                    <div style={{ fontSize: 28, fontWeight: 950, color: cor, lineHeight:1 }}>
                      {t.val}
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 800, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.5px' }}>{t.unit}</div>
                    <div style={{ fontSize: 12, fontWeight: 900, color: '#0f172a', lineHeight:1.2 }}>{t.lbl}</div>
                      {t.cls && (
                        <span style={{ display:'inline-block', marginTop:7, padding: '3px 9px', borderRadius: 100, fontSize: 9, fontWeight: 800, background: `${cor}18`, color: cor, border:`1px solid ${cor}30` }}>
                          {t.cls}
                        </span>
                      )}
                  </div>
                );
              })}
            </div>

          </div>
        );
      })()}

      {/* ══ BIOMECÂNICA DA CORRIDA ══ */}
      {atual?.biomecanica_corrida && (() => {
        const bio = atual.biomecanica_corrida as any;
        const ang = bio.angulos ?? {};
        const met = bio.metricas ?? {};
        return (
          <div style={{ order: 100, background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: '24px 28px', color: '#0f172a' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 14, borderBottom: '1px solid #f1f5f9' }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>Biomecânica da corrida</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 3 }}>
                  Cinemática 2D · {bio.movimento ?? 'Corrida'} · {bio.velocidade_kmh ?? '—'} km/h
                </div>
              </div>
              {bio.link_video && (
                <a href={bio.link_video} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 15px',
                    background: '#059669', border: '1px solid #047857', borderRadius: 999,
                    boxShadow: '0 6px 14px rgba(5,150,105,.22)',
                    fontSize: 12, fontWeight: 800, color: 'white', textDecoration: 'none' }}>
                  ▶ Ver vídeo
                </a>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: bio.foto_frame_url ? '1fr 1fr' : '1fr', gap: 20 }}>
              {/* Frame anotado */}
              {bio.foto_frame_url && (
                <div>
                  <img src={bio.foto_frame_url} alt="Frame cinemático"
                    style={{ width: '100%', maxHeight: 340, objectFit: 'contain', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }} />
                </div>
              )}

              <div>
                {/* Métricas temporais */}
                {Object.keys(met).length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>
                      Métricas da passada
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {[
                        ['Frequência de passos', met.frequencia_passos_ppm, 'passos por minuto'],
                        ['Comprimento da passada', met.comprimento_passada_m, 'metros'],
                        ['Tempo de contato com o solo', met.tempo_contato_solo_s, 'segundos'],
                        ['Tempo de voo', met.tempo_voo_s, 'segundos'],
                        ['Fator de esforço', met.fator_esforco_pct, `% ${met.fator_esforco_tipo ?? ''}`],
                        ['Comprimento do passo', met.comprimento_passo_m, 'metros'],
                      ].filter(([, v]) => v != null).map(([l, v, u]: any) => (
                        <div key={l} style={{ background: '#f8fafc', borderRadius: 8, padding: '8px 12px', border: '1px solid #f1f5f9' }}>
                          <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.3px' }}>{l}</div>
                          <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginTop: 2 }}>
                            {v} <span style={{ fontSize: 10, fontWeight: 400, color: '#94a3b8' }}>{u}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Angulos cinematicos */}
                {Object.keys(ang).length > 0 && (
                  <div>
                    <BiomecanicaRunnerCompare ang={ang} />
                    {bio.comentarios_angulos && Object.values(bio.comentarios_angulos).some(Boolean) && (
                      <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.5px' }}>
                          Comentarios dos achados
                        </div>
                        {Object.entries(bio.comentarios_angulos).filter(([, comentario]: any) => Boolean(comentario)).map(([k, comentario]: any) => (
                          <div key={k} style={{ padding: '10px 12px', borderRadius: 10, background: '#fff', border: '1px solid #e2e8f0', fontSize: 11, lineHeight: 1.6, color: '#334155', whiteSpace: 'pre-line', overflowWrap: 'anywhere' }}>
                            <strong style={{ color: '#0f172a' }}>{humanField(k)}:</strong> {comentario}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Achados e recomendações — só no modo clínico */}
            {modo === 'clinico' && bio.achados && (
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>
                  Achados clínicos
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {bio.achados.mecanica_frenagem && <span style={{ background: '#fef2f2', color: '#991b1b', fontSize: 11, padding: '3px 10px', borderRadius: 20, border: '0.5px solid #fca5a5' }}>Mecânica de frenagem</span>}
                  {bio.achados.sobrecarga_articular && <span style={{ background: '#fef2f2', color: '#991b1b', fontSize: 11, padding: '3px 10px', borderRadius: 20, border: '0.5px solid #fca5a5' }}>Sobrecarga articular</span>}
                  {bio.achados.deslocamento_cg && <span style={{ background: '#fef2f2', color: '#991b1b', fontSize: 11, padding: '3px 10px', borderRadius: 20, border: '0.5px solid #fca5a5' }}>Deslocamento do CG</span>}
                  {bio.achados.ineficiencia_propulsiva && <span style={{ background: '#fef2f2', color: '#991b1b', fontSize: 11, padding: '3px 10px', borderRadius: 20, border: '0.5px solid #fca5a5' }}>Ineficiência propulsiva</span>}
                </div>
                {bio.achados.comentarios_risco && (
                  <div style={{ marginTop: 8, padding: '10px 11px', borderRadius: 8, background: '#fff7ed', border: '1px solid #fed7aa', fontSize: 12, color: '#7c2d12', lineHeight: 1.55, whiteSpace: 'pre-line', overflowWrap:'anywhere' }}>
                    {bio.achados.comentarios_risco}
                  </div>
                )}
                {bio.achados.observacoes && (
                  <div style={{ marginTop: 8, padding: '10px 11px', borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: 12, color: '#334155', lineHeight: 1.55, whiteSpace: 'pre-line', overflowWrap:'anywhere' }}>
                    {bio.achados.observacoes}
                  </div>
                )}
              </div>
            )}

            {/* Gráficos cinemáticos — só no modo clínico */}
            {bio.graficos && Object.values(bio.graficos).some(Boolean) && (
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 10 }}>
                  Gráficos cinemáticos
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px,1fr))', gap: 14 }}>
                  {[
                    ['joelho_url', 'joelho', 'Joelho'], ['quadril_url', 'quadril', 'Quadril'], ['cotovelo_url', 'cotovelo', 'Cotovelo'],
                  ].filter(([k]) => bio.graficos[k]).map(([k, _ck, l]) => (
                    <div key={k} style={{ maxWidth: 560, width: '100%', margin: '0 auto' }}>
                      <div style={{ fontSize: 11, color: '#0f172a', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>{l}</div>
                      <div style={{ width: '100%', aspectRatio: '544 / 443', background: '#050505', borderRadius: 8, border: '1px solid #1f2937', overflow: 'hidden' }}>
                        <img src={bio.graficos[k]} alt={l}
                          style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
                      </div>
                    </div>
                  ))}
                </div>
                {bio.comentarios_graficos?.geral && (
                  <div style={{ marginTop: 10, padding: '10px 11px', borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: 9, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 }}>Comentário geral dos gráficos</div>
                    <div style={{ fontSize: 12, lineHeight: 1.55, color: '#334155', whiteSpace: 'pre-line' }}>{bio.comentarios_graficos.geral}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })()}

      {/* ══ LISTA DE AVALIAÇÕES ══ */}
      <div style={{ order: 120, background: 'white', borderRadius: 16, padding: '24px 28px', color: '#0f172a' }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Todas as avaliações</div>
        <div>
          {hist.ordenadas.slice().reverse().map(a => {
            const emAndamento = a.status !== 'finalizada';
            const primeiroStep = (() => {
              const m = a.modulos_selecionados ?? {};
              if (m.anamnese)            return 'anamnese';
              if (m.sinais_vitais)       return 'sinais-vitais';
              if (m.posturografia)       return 'posturografia';
              if (m.bioimpedancia)       return 'bioimpedancia';
              if (m.antropometria)       return 'antropometria';
              if (m.flexibilidade)       return 'flexibilidade';
              if (m.forca)               return 'forca';
              if (m.rml)                 return 'rml';
              if (m.cardiorrespiratorio) return 'cardiorrespiratorio';
              if (m.biomecanica_corrida || m.biomecanica) return 'biomecanica';
              return 'revisao';
            })();
            return (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>
                      {new Date(a.data).toLocaleDateString('pt-BR')}
                    </span>
                    <span style={{
                      fontSize: 10, padding: '2px 10px', borderRadius: 100, fontWeight: 600,
                      background: emAndamento ? 'rgba(245,158,11,.15)' : 'rgba(16,185,129,.15)',
                      color: emAndamento ? '#f59e0b' : '#10b981',
                    }}>
                      {emAndamento ? 'Em andamento' : 'Concluída'}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>
                    {a.tipo} · Score global: <b style={{ color: '#0f172a' }}>{a.scores?.global ?? '—'}</b>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {modo === 'clinico' && emAndamento && (
                    <a href={`/avaliacoes/${a.id}/${primeiroStep}`}>
                      <button style={btnStyle('#059669')}>
                        <Pencil size={12} /> Continuar
                      </button>
                    </a>
                  )}
                  {modo === 'clinico' && !emAndamento && (
                    <a href={`/avaliacoes/${a.id}/revisao`}>
                      <button style={btnStyle('rgba(255,255,255,.1)')}>
                        <Sparkles size={12} /> IA
                      </button>
                    </a>
                  )}
                  {!emAndamento && modo === 'clinico' && (
                    <a href={pdfHref(a.id)} target="_blank" rel="noreferrer">
                      <button style={btnStyle('rgba(255,255,255,.1)')}>
                        <FileDown size={12} /> PDF
                      </button>
                    </a>
                  )}
                  {modo === 'clinico' && (
                    <ExcluirAvalBtn avaliacaoId={a.id} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {modo === 'publico' && (
        <p style={{ textAlign: 'center', fontSize: 11, color: '#94a3b8', marginTop: 8 }}>
          Este dashboard foi compartilhado pelo seu avaliador. Dados pessoais e laudos são confidenciais.
        </p>
      )}
    </div>
  );
}

function btnStyle(bg: string) {
  return {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    background: bg, border: '1px solid #e2e8f0',
    borderRadius: 8, color: '#0f172a', fontSize: 11, fontWeight: 600,
    padding: '5px 12px', cursor: 'pointer',
  } as React.CSSProperties;
}

function ExcluirAvalBtn({ avaliacaoId }: { avaliacaoId: string }) {
  const supabase = createClient();
  const [excluindo, setExcluindo] = useState(false);
  async function excluir() {
    if (!confirm('Excluir esta avaliação permanentemente? Todos os dados serão perdidos.')) return;
    setExcluindo(true);
    await supabase.from('avaliacoes').delete().eq('id', avaliacaoId);
    window.location.reload();
  }
  return (
    <button onClick={excluir} disabled={excluindo}
      style={{ ...btnStyle('rgba(239,68,68,.15)'), borderColor: 'rgba(239,68,68,.2)' }}>
      <Trash2 size={12} style={{ color: '#f87171' }} />
    </button>
  );
}
