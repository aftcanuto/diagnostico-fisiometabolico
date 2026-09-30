'use client';
import { use, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Plus, Trash2 } from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Field, Input, Label, Select, Textarea } from '@/components/ui/Input';
import { SaveIndicator } from '@/components/ui/SaveIndicator';
import { createClient } from '@/lib/supabase/client';
import { buscarModulo, upsertModulo } from '@/lib/modulos';
import { useAutoSave } from '@/lib/useAutoSave';
import { buildSteps } from '@/lib/steps';

const VISTAS = [
  ['foto_anterior', 'Anterior'], ['foto_posterior', 'Posterior'],
  ['foto_lateral_dir', 'Lateral direita'], ['foto_lateral_esq', 'Lateral esquerda'],
] as const;
const REGIOES = [
  'Cervical','Trapézio','Ombro/Deltoide','Peitoral','Escápula','Braço anterior',
  'Braço posterior','Cotovelo','Antebraço','Punho/Mão','Coluna torácica',
  'Coluna lombar','Abdômen','Quadril','Glúteo','Coxa anterior','Coxa medial',
  'Coxa posterior','Joelho anterior','Joelho posterior','Panturrilha',
  'Tendão de Aquiles','Tornozelo','Pé dorsal','Pé plantar','Personalizada',
];
const vazio = {
  momento:'basal', temperatura_ambiente:'', umidade_relativa:'',
  tempo_aclimatacao_min:'', distancia_cm:'', emissividade:0.98, capturado_em:'',
  recomendacoes_seguidas:null, recomendacoes_observacao:'',
  ambiente_estavel:false, sem_corrente_ar:false, sem_sol_direto:false,
  sem_fonte_calor:false, regiao_exposta:false, condicoes_observacao:'',
  equipamento_fabricante:'HIKMICRO', equipamento_modelo:'Pocket2',
  equipamento_software:'HIKMICRO Analyzer',
  foto_anterior:null, foto_posterior:null, foto_lateral_dir:null, foto_lateral_esq:null,
  rois:[], imagens_complementares:[], achados_termicos:'',
  assimetrias_relevantes:'', correlacao_clinica:'', limitacoes:'',
  recomendacoes:'', encaminhamento:'', conclusao_funcional:'', observacoes:'',
};
const num = (v:any) => v === '' || v == null ? null : Number(v);

export default function TermografiaPage(props:{params:Promise<{id:string}>}) {
  const { id } = use(props.params);
  const router = useRouter();
  const supabase = createClient();
  const [aval,setAval] = useState<any>(null);
  const [form,setForm] = useState<any>(vazio);
  const [loaded,setLoaded] = useState(false);
  const [uploading,setUploading] = useState('');

  useEffect(() => { (async()=>{
    const {data:av}=await supabase.from('avaliacoes').select('clinica_id,modulos_selecionados').eq('id',id).single();
    setAval(av);
    const d=await buscarModulo('termografia',id).catch(()=>null);
    if(d) setForm({...vazio,...d,rois:d.rois??[],imagens_complementares:d.imagens_complementares??[]});
    else if(av?.clinica_id){
      const {data:cfg}=await supabase.from('termografia_config').select('*').eq('clinica_id',av.clinica_id).maybeSingle();
      if(cfg) setForm((f:any)=>({...f,equipamento_fabricante:cfg.fabricante,equipamento_modelo:cfg.modelo,equipamento_software:cfg.software}));
    }
    setLoaded(true);
  })(); },[id,supabase]);

  const saveState=useAutoSave(form,async(v)=>{
    if(!loaded||!aval?.clinica_id)return;
    await upsertModulo('termografia',id,{...v,clinica_id:aval.clinica_id,
      temperatura_ambiente:num(v.temperatura_ambiente),umidade_relativa:num(v.umidade_relativa),
      tempo_aclimatacao_min:num(v.tempo_aclimatacao_min),distancia_cm:num(v.distancia_cm),
      emissividade:0.98,capturado_em:v.capturado_em||null});
  });

  async function upload(key:string,file:File,complementar=false){
    if(!aval?.clinica_id)return;
    setUploading(key);
    const ext=file.name.split('.').pop()?.toLowerCase()||'jpg';
    const path=`${aval.clinica_id}/${id}/${key}_${Date.now()}.${ext}`;
    const {error}=await supabase.storage.from('termografia').upload(path,file,{upsert:true});
    if(error){alert(error.message);setUploading('');return;}
    const {data}=await supabase.storage.from('termografia').createSignedUrl(path,60*60*24*365);
    const url=data?.signedUrl??path;
    if(complementar) setForm((f:any)=>({...f,imagens_complementares:[...f.imagens_complementares,{url,path,titulo:'Imagem complementar',regiao:'',lado:'central',momento:'basal',observacao:''}]}));
    else setForm((f:any)=>({...f,[key]:url}));
    setUploading('');
  }
  async function uploadComplementares(files:FileList|null){
    if(!files?.length)return;
    for(const file of Array.from(files)) await upload('complementar',file,true);
  }
  async function removerComplementar(index:number){
    const imagem=form.imagens_complementares[index];
    if(imagem?.path) await supabase.storage.from('termografia').remove([imagem.path]);
    setForm((f:any)=>({...f,imagens_complementares:f.imagens_complementares.filter((_:any,n:number)=>n!==index)}));
  }
  function addRoi(){setForm((f:any)=>({...f,rois:[...f.rois,{regiao:'Ombro/Deltoide',nome_personalizado:'',lado:'D',temp_media:'',temp_min:'',temp_max:'',dor:false,intensidade_dor:'',observacao:''}]}));}
  function roi(i:number,k:string,v:any){setForm((f:any)=>({...f,rois:f.rois.map((r:any,n:number)=>n===i?{...r,[k]:v}:r)}));}
  const assimetrias=useMemo(()=>{
    const grupos=new Map<string,any>();
    form.rois.forEach((r:any)=>{const nome=r.regiao==='Personalizada'?r.nome_personalizado:r.regiao;if(!nome)return;const g=grupos.get(nome)||{};g[r.lado]=r;grupos.set(nome,g);});
    return [...grupos].flatMap(([regiao,g])=>g.D?.temp_media!==''&&g.E?.temp_media!==''?[{regiao,delta:Math.abs(Number(g.D.temp_media)-Number(g.E.temp_media))}]:[]).sort((a,b)=>b.delta-a.delta);
  },[form.rois]);
  const steps=aval?buildSteps(id,aval.modulos_selecionados):[];
  const prev=steps.find(s=>s.key==='posturografia');
  const next=steps.slice(steps.findIndex(s=>s.key==='termografia')+1).find(s=>s.enabled);
  const check=(key:string,label:string)=><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!form[key]} onChange={e=>setForm((f:any)=>({...f,[key]:e.target.checked}))}/>{label}</label>;

  return <div className="max-w-6xl space-y-5">
    <Card><CardHeader><CardTitle>Protocolo e condições da coleta</CardTitle></CardHeader><CardBody className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        <Field label="Temperatura ambiente (°C)"><Input type="number" step="0.1" value={form.temperatura_ambiente??''} onChange={e=>setForm((f:any)=>({...f,temperatura_ambiente:e.target.value}))}/></Field>
        <Field label="Umidade relativa (%)"><Input type="number" step="0.1" value={form.umidade_relativa??''} onChange={e=>setForm((f:any)=>({...f,umidade_relativa:e.target.value}))}/></Field>
        <Field label="Aclimatação (min)"><Input type="number" value={form.tempo_aclimatacao_min??''} onChange={e=>setForm((f:any)=>({...f,tempo_aclimatacao_min:e.target.value}))}/></Field>
        <Field label="Distância da câmera (cm)"><Input type="number" step="0.1" value={form.distancia_cm??''} onChange={e=>setForm((f:any)=>({...f,distancia_cm:e.target.value}))}/></Field>
        <Field label="Data e horário"><Input type="datetime-local" value={form.capturado_em?.slice?.(0,16)??''} onChange={e=>setForm((f:any)=>({...f,capturado_em:e.target.value}))}/></Field>
        <Field label="Emissividade"><Input value="0,98" disabled/></Field>
      </div>
      <div className="rounded-lg border p-3">
        <div className="font-medium text-sm mb-2">O paciente seguiu as recomendações pré-teste?</div>
        <div className="flex gap-5"><label><input type="radio" checked={form.recomendacoes_seguidas===true} onChange={()=>setForm((f:any)=>({...f,recomendacoes_seguidas:true,recomendacoes_observacao:''}))}/> Sim</label><label><input type="radio" checked={form.recomendacoes_seguidas===false} onChange={()=>setForm((f:any)=>({...f,recomendacoes_seguidas:false}))}/> Não</label></div>
        {form.recomendacoes_seguidas===false&&<div className="mt-3"><Label>Observação</Label><Textarea value={form.recomendacoes_observacao} onChange={e=>setForm((f:any)=>({...f,recomendacoes_observacao:e.target.value}))}/></div>}
      </div>
      <div className="grid gap-3 md:grid-cols-3">{check('ambiente_estavel','Ambiente estável')}{check('sem_corrente_ar','Sem corrente de ar')}{check('sem_sol_direto','Sem luz solar direta')}{check('sem_fonte_calor','Sem fonte de calor próxima')}{check('regiao_exposta','Região exposta durante a aclimatação')}</div>
      <div><Label>Observações das condições</Label><Textarea value={form.condicoes_observacao} onChange={e=>setForm((f:any)=>({...f,condicoes_observacao:e.target.value}))}/></div>
      <div className="rounded-lg bg-slate-50 p-3 text-sm"><strong>Equipamento:</strong> {form.equipamento_fabricante} {form.equipamento_modelo} · <strong>Software:</strong> {form.equipamento_software}</div>
    </CardBody></Card>

    <Card><CardHeader><CardTitle>Termogramas basais obrigatórios</CardTitle></CardHeader><CardBody><div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {VISTAS.map(([key,label])=><div key={key}><Label>{label}</Label><label className="relative block aspect-[3/4] cursor-pointer overflow-hidden rounded-lg border-2 border-dashed bg-slate-50">
        {form[key]?<img src={form[key]} alt={label} className="h-full w-full object-contain"/>:<div className="absolute inset-0 grid place-items-center text-xs text-slate-500"><span><Upload className="mx-auto mb-1 h-5 w-5"/>{uploading===key?'Enviando...':'Enviar'}</span></div>}
        <input className="hidden" type="file" accept="image/*" onChange={e=>e.target.files?.[0]&&upload(key,e.target.files[0])}/>
      </label></div>)}
    </div></CardBody></Card>

    <Card><CardHeader><CardTitle>Regiões de interesse (ROIs)</CardTitle></CardHeader><CardBody className="space-y-3">
      {form.rois.map((r:any,i:number)=><div key={i} className="grid gap-2 rounded-lg border p-3 md:grid-cols-8">
        <Select value={r.regiao} onChange={e=>roi(i,'regiao',e.target.value)}>{REGIOES.map(x=><option key={x}>{x}</option>)}</Select>
        {r.regiao==='Personalizada'&&<Input placeholder="Nome da região" value={r.nome_personalizado} onChange={e=>roi(i,'nome_personalizado',e.target.value)}/>}
        <Select value={r.lado} onChange={e=>roi(i,'lado',e.target.value)}><option value="D">Direito</option><option value="E">Esquerdo</option><option value="central">Central</option></Select>
        <Input type="number" step="0.1" placeholder="Média °C" value={r.temp_media} onChange={e=>roi(i,'temp_media',e.target.value)}/>
        <Input type="number" step="0.1" placeholder="Mín. °C" value={r.temp_min} onChange={e=>roi(i,'temp_min',e.target.value)}/>
        <Input type="number" step="0.1" placeholder="Máx. °C" value={r.temp_max} onChange={e=>roi(i,'temp_max',e.target.value)}/>
        <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={!!r.dor} onChange={e=>roi(i,'dor',e.target.checked)}/> Dor</label>
        <Input type="number" min="0" max="10" placeholder="Dor 0-10" value={r.intensidade_dor} onChange={e=>roi(i,'intensidade_dor',e.target.value)}/>
        <div className="flex gap-1"><Input placeholder="Observação" value={r.observacao} onChange={e=>roi(i,'observacao',e.target.value)}/><Button variant="ghost" onClick={()=>setForm((f:any)=>({...f,rois:f.rois.filter((_:any,n:number)=>n!==i)}))}><Trash2 className="h-4 w-4"/></Button></div>
      </div>)}
      <Button variant="secondary" onClick={addRoi}><Plus className="h-4 w-4"/>Adicionar ROI</Button>
      {assimetrias.length>0&&<div className="rounded-lg bg-slate-50 p-3"><div className="font-semibold text-sm">Comparação bilateral</div>{assimetrias.map(a=><div key={a.regiao} className="mt-1 text-sm">{a.regiao}: <strong>{a.delta.toFixed(1)} °C</strong>{a.delta>0.5&&<span className="ml-2 text-amber-700">revisar</span>}</div>)}<p className="mt-2 text-xs text-slate-500">Sinalização de triagem, sem valor diagnóstico isolado.</p></div>}
    </CardBody></Card>

    <Card><CardHeader><CardTitle>Imagens complementares (opcional)</CardTitle></CardHeader><CardBody className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm"><Upload className="h-4 w-4"/>{uploading==='complementar'?'Enviando...':'Adicionar imagens'}<input className="hidden" type="file" accept="image/*" multiple onChange={async e=>{await uploadComplementares(e.target.files);e.target.value='';}}/></label>
        <span className="text-xs text-slate-500">Sem limite fixo · {form.imagens_complementares.length} anexada(s)</span>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{form.imagens_complementares.map((img:any,i:number)=><div key={`${img.path??img.url}-${i}`} className="rounded-lg border p-2"><img src={img.url} alt={img.titulo || `Imagem complementar ${i + 1}`} className="h-40 w-full object-contain"/><div className="mt-2 flex gap-2"><Input value={img.titulo} onChange={e=>setForm((f:any)=>({...f,imagens_complementares:f.imagens_complementares.map((x:any,n:number)=>n===i?{...x,titulo:e.target.value}:x)}))}/><Button variant="ghost" onClick={()=>removerComplementar(i)} title="Excluir imagem"><Trash2 className="h-4 w-4"/></Button></div></div>)}</div>
    </CardBody></Card>

    <Card><CardHeader><CardTitle>Interpretação profissional</CardTitle></CardHeader><CardBody className="grid gap-4 md:grid-cols-2">
      {[['achados_termicos','Achados térmicos'],['assimetrias_relevantes','Assimetrias relevantes'],['correlacao_clinica','Correlação clínica'],['limitacoes','Limitações da coleta'],['recomendacoes','Recomendações'],['encaminhamento','Investigação complementar'],['conclusao_funcional','Conclusão funcional'],['observacoes','Observações gerais']].map(([k,l])=><div key={k}><Label>{l}</Label><Textarea value={form[k]??''} onChange={e=>setForm((f:any)=>({...f,[k]:e.target.value}))}/></div>)}
    </CardBody></Card>
    <div className="flex justify-between"><Button variant="secondary" onClick={()=>router.push(prev?.href??`/avaliacoes/${id}/posturografia`)}>← Voltar</Button><Button onClick={()=>router.push(next?.href??`/avaliacoes/${id}/revisao`)}>Continuar →</Button></div>
    <SaveIndicator state={saveState}/>
  </div>;
}
