'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Field, Input, Select, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { SaveIndicator } from '@/components/ui/SaveIndicator';
import { buscarModulo, upsertModulo } from '@/lib/modulos';
import { useAutoSave } from '@/lib/useAutoSave';
import { createClient } from '@/lib/supabase/client';
import { ExternalLink, Activity, AlertTriangle, CheckCircle } from 'lucide-react';
import { buildSteps } from '@/lib/steps';

const ANGULOS_REF = {
  cabeca:                   { plano: 'Plano sagital', label: 'Alinhamento da cabeça', min: -13, max: -3 },
  tronco:                   { plano: 'Plano sagital', label: 'Posicionamento do tronco', min: 8, max: 14 },
  aterrissagem_passada:     { plano: 'Plano sagital', label: 'Aterrissagem (passada)', min: 0, max: 10 },
  joelho_frente_contato:    { plano: 'Plano sagital', label: 'Ângulo do joelho da frente ao bater o pé', min: 155, max: 175 },
  joelho_posterior_contato: { plano: 'Plano sagital', label: 'Ângulo posterior do joelho ao bater o pé', min: 80, max: 100 },
  bracos:                   { plano: 'Plano sagital', label: 'Posição dos braços', min: 77, max: 87 },
  queda_pelve_esq:          { plano: 'Plano posterior', label: 'Queda da pelve no pouso do pé esquerdo', min: 0, max: 5 },
  queda_pelve_dir:          { plano: 'Plano posterior', label: 'Queda da pelve no pouso do pé direito', min: 0, max: 5 },
  alinhamento_joelho_esq:   { plano: 'Plano posterior', label: 'Alinhamento do joelho da perna esquerda', min: -5, max: 5 },
  alinhamento_joelho_dir:   { plano: 'Plano posterior', label: 'Alinhamento do joelho da perna direita', min: -5, max: 5 },
  pronacao_supinacao_esq:   { plano: 'Plano posterior', label: 'Pronação/Supinação pé esquerdo', min: -5, max: 8 },
  pronacao_supinacao_dir:   { plano: 'Plano posterior', label: 'Pronação/Supinação pé direito', min: -5, max: 8 },
} as const;

function classAngle(val: number, min: number, max: number): 'ideal' | 'atencao' | 'fora' {
  if (val >= min && val <= max) return 'ideal';
  const margin = (max - min) * 0.2;
  if (val >= min - margin && val <= max + margin) return 'atencao';
  return 'fora';
}

const CLS_COLOR = { ideal: 'text-emerald-600', atencao: 'text-amber-600', fora: 'text-red-600' };
const CLS_BG    = { ideal: 'bg-emerald-50 border-emerald-200', atencao: 'bg-amber-50 border-amber-200', fora: 'bg-red-50 border-red-200' };
const CLS_LABEL = { ideal: 'Ideal ✓', atencao: 'Atenção', fora: 'Fora do ideal' };

const GRAFICOS_CINEMATICOS = [
  ['ombro_url', 'Grafico 1 - Ombro'],
  ['cotovelo_url', 'Grafico 2 - Cotovelo'],
  ['quadril_url', 'Grafico 3 - Quadril'],
  ['joelho_url', 'Grafico 4 - Joelho'],
  ['tornozelo_url', 'Grafico 5 - Tornozelo'],
] as const;

const IMAGENS_SAGITAL = [
  ['sagital_1_url', 'Imagem sagital 1'],
  ['sagital_2_url', 'Imagem sagital 2'],
  ['sagital_3_url', 'Imagem sagital 3'],
] as const;

const IMAGENS_POSTERIOR = [
  ['posterior_1_url', 'Nível Pelve lado esquerdo'],
  ['posterior_2_url', 'Nível Pelve lado direito'],
  ['posterior_3_url', 'Alinhamento Joelho Esquerdo'],
  ['posterior_4_url', 'Alinhamento Joelho direito'],
  ['posterior_5_url', 'Análise pé esquerdo'],
  ['posterior_6_url', 'Análise pé direito'],
] as const;

export default function BiomecanicaPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const supabase = createClient();
  const [aval, setAval] = useState<any>(null);

  const [velocidade, setVelocidade] = useState('');
  const [movimento,  setMovimento]  = useState('Corrida em esteira');
  const [linkVideo,  setLinkVideo]  = useState('');
  const [linkVideoPosterior, setLinkVideoPosterior] = useState('');
  const [fotoFrame,  setFotoFrame]  = useState('');

  const [metricas, setMetricas] = useState({
    tempo_voo_s: '', tempo_contato_solo_s: '',
    frequencia_passos_ppm: '', comprimento_passo_m: '',
    comprimento_passada_m: '', fator_esforco_pct: '', fator_esforco_tipo: 'Aéreo',
  });

  const [angulos, setAngulos] = useState<Record<string, string>>({
    cabeca: '', tronco: '', aterrissagem_passada: '',
    joelho_frente_contato: '', joelho_posterior_contato: '', bracos: '',
    queda_pelve_esq: '', queda_pelve_dir: '',
    alinhamento_joelho_esq: '', alinhamento_joelho_dir: '',
    pronacao_supinacao_esq: '', pronacao_supinacao_dir: '',
  });

  const [comentariosAngulos, setComentariosAngulos] = useState<Record<string, string>>(
    Object.fromEntries(Object.keys(ANGULOS_REF).map(k => [k, '']))
  );

  const [achados, setAchados] = useState({
    mecanica_frenagem: false, sobrecarga_articular: false,
    deslocamento_cg: false, ineficiencia_propulsiva: false,
    comentarios_risco: '', observacoes: '',
  });

  const [recomendacoes, setRec] = useState({
    correcao_postura: '', ajuste_passada: '',
    exercicios_dinamicos: '', complementos: '',
  });

  const [graficos, setGraficos] = useState({
    ombro_url: '', cotovelo_url: '', quadril_url: '', joelho_url: '', tornozelo_url: '',
    sagital_1_url: '', sagital_2_url: '', sagital_3_url: '',
    posterior_1_url: '', posterior_2_url: '', posterior_3_url: '',
    posterior_4_url: '', posterior_5_url: '', posterior_6_url: '',
  });

  const [comentarioGraficos, setComentarioGraficos] = useState('');

  useEffect(() => {
    (async () => {
      const { data: av } = await supabase.from('avaliacoes')
        .select('*, pacientes(*)').eq('id', params.id).single();
      setAval(av);
      const d = await buscarModulo('biomecanica_corrida', params.id);
      if (d) {
        setVelocidade(d.velocidade_kmh?.toString() ?? '');
        setMovimento(d.movimento ?? 'Corrida em esteira');
        setLinkVideo(d.link_video ?? '');
        setLinkVideoPosterior(d.link_video_posterior ?? '');
        setFotoFrame(d.foto_frame_url ?? '');
        if (d.metricas) {
          const m = d.metricas as any;
          setMetricas(prev => ({ ...prev, ...Object.fromEntries(
            Object.entries(m).map(([k, v]) => [k, String(v ?? '')])
          )}));
        }
        if (d.angulos) {
          const ang = d.angulos as any;
          setAngulos(prev => ({ ...prev, ...Object.fromEntries(
            Object.entries(ang).map(([k, v]: any) => [k, String(v?.valor ?? '')])
          )}));
        }
        if (d.achados)       setAchados(a => ({ ...a, ...(d.achados as any) }));
        if (d.recomendacoes) setRec(r => ({ ...r, ...(d.recomendacoes as any) }));
        if (d.graficos)      setGraficos(g => ({ ...g, ...(d.graficos as any) }));
        if (d.comentarios_angulos) setComentariosAngulos(c => ({ ...c, ...(d.comentarios_angulos as any) }));
        if (d.comentarios_graficos) {
          const cg = d.comentarios_graficos as any;
          setComentarioGraficos(cg.geral ?? [cg.ombro, cg.cotovelo, cg.quadril, cg.joelho, cg.tornozelo].filter(Boolean).join('\n\n'));
        }
      }
    })();
  }, [params.id]);

  function buildAngulos(values = angulos) {
    const result: any = {};
    for (const [key, ref] of Object.entries(ANGULOS_REF)) {
      const val = parseFloat(values[key]);
      if (!isNaN(val)) {
        result[key] = { valor: val, ideal_min: ref.min, ideal_max: ref.max,
          classificacao: classAngle(val, ref.min, ref.max) };
      }
    }
    return result;
  }

  async function uploadGrafico(key: keyof typeof graficos, file: File) {
    const body = new FormData();
    body.append('avaliacaoId', params.id);
    body.append('key', key);
    body.append('file', file);
    const res = await fetch('/api/uploads/biomecanica', { method: 'POST', body });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.url) {
      alert(data.error ?? 'Nao foi possivel enviar a imagem.');
      return;
    }
    setGraficos(g => ({ ...g, [key]: data.url }));
  }

  const autoSaveValue = { velocidade, movimento, linkVideo, linkVideoPosterior, fotoFrame, metricas, angulos, comentariosAngulos, achados, recomendacoes, graficos, comentarioGraficos };

  const salvar = async (v = autoSaveValue) => {
    const met: any = {};
    for (const [k, val] of Object.entries(v.metricas)) {
      if (k === 'fator_esforco_tipo') met[k] = val;
      else { const n = parseFloat(val); if (!isNaN(n)) met[k] = n; }
    }
    return upsertModulo('biomecanica_corrida', params.id, {
      velocidade_kmh: parseFloat(v.velocidade) || null,
      movimento: v.movimento, link_video: v.linkVideo, link_video_posterior: v.linkVideoPosterior, foto_frame_url: v.fotoFrame,
      metricas: met, angulos: buildAngulos(v.angulos),
      comentarios_angulos: v.comentariosAngulos,
      achados: v.achados, recomendacoes: v.recomendacoes, graficos: v.graficos,
      comentarios_graficos: { geral: v.comentarioGraficos },
    });
  };

  const saving = useAutoSave(autoSaveValue, salvar, 2000);

  if (!aval) return <p className="text-slate-500">Carregando…</p>;
  const steps = buildSteps(params.id, aval.modulos_selecionados);

  return (
    <div>
      <div className="max-w-4xl space-y-5 mt-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Activity className="w-5 h-5 text-brand-600" /> Biomecânica da Corrida (Cinemática 2D)
          </h2>
          <SaveIndicator state={saving} />
        </div>

        {/* Dados gerais */}
        <Card>
          <CardHeader><CardTitle>Dados gerais</CardTitle></CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Velocidade de corrida (km/h)">
                <Input type="number" step="0.1" value={velocidade} onChange={e => setVelocidade(e.target.value)} />
              </Field>
              <Field label="Movimento analisado">
                <Select value={movimento} onChange={e => setMovimento(e.target.value)}>
                  <option>Corrida em esteira</option>
                  <option>Corrida em pista</option>
                  <option>Corrida na rua</option>
                  <option>Caminhada em esteira</option>
                  <option>Outro</option>
                </Select>
              </Field>
            </div>
            <Field label="Link do video plano sagital">
              <div className="flex gap-2">
                <Input value={linkVideo} onChange={e => setLinkVideo(e.target.value)}
                  placeholder="https://drive.google.com/..." className="flex-1" />
                {linkVideo && (
                  <a href={linkVideo} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="secondary" type="button">
                      <ExternalLink className="w-3 h-3" /> Ver
                    </Button>
                  </a>
                )}
              </div>
            </Field>
            <Field label="URL do frame anotado (imagem com ângulos marcados)">
              <div className="mb-4">
                <Field label="Link do video plano posterior">
                  <div className="flex gap-2">
                    <Input value={linkVideoPosterior} onChange={e => setLinkVideoPosterior(e.target.value)}
                      placeholder="https://drive.google.com/..." className="flex-1" />
                    {linkVideoPosterior && (
                      <a href={linkVideoPosterior} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="secondary" type="button">
                          <ExternalLink className="w-3 h-3" /> Ver
                        </Button>
                      </a>
                    )}
                  </div>
                </Field>
              </div>
              <Input value={fotoFrame} onChange={e => setFotoFrame(e.target.value)}
                placeholder="URL da imagem no Storage ou Drive" />
              {fotoFrame && (
                <img src={fotoFrame} alt="Frame anotado" className="mt-2 max-h-56 rounded-lg border border-slate-200" />
              )}
            </Field>
          </CardBody>
        </Card>

        {/* Métricas da passada */}
        <Card>
          <CardHeader><CardTitle>Métricas temporais da passada</CardTitle></CardHeader>
          <CardBody>
            <div className="grid grid-cols-3 gap-4">
              {([
                ['tempo_voo_s',           'Tempo de voo (s)'],
                ['tempo_contato_solo_s',  'Tempo contato solo (s)'],
                ['frequencia_passos_ppm', 'Frequência de passos (ppm)'],
                ['comprimento_passo_m',   'Comprimento do passo (m)'],
                ['comprimento_passada_m', 'Comprimento da passada (m)'],
                ['fator_esforco_pct',     'Fator de esforço (%)'],
              ] as [string, string][]).map(([key, label]) => (
                <Field key={key} label={label}>
                  <Input type="number" step="0.01" value={(metricas as any)[key]}
                    onChange={e => setMetricas(m => ({ ...m, [key]: e.target.value }))} />
                </Field>
              ))}
              <Field label="Tipo de fator de esforço">
                <Select value={metricas.fator_esforco_tipo}
                  onChange={e => setMetricas(m => ({ ...m, fator_esforco_tipo: e.target.value }))}>
                  <option>Aéreo</option>
                  <option>Terrestre</option>
                </Select>
              </Field>
            </div>
          </CardBody>
        </Card>

        {/* Ângulos cinemáticos */}
        <Card>
          <CardHeader>
            <CardTitle>Ângulos cinemáticos</CardTitle>
            <p className="text-xs text-slate-500 mt-1">Insira o valor medido — classificação automática vs faixa ideal da literatura</p>
          </CardHeader>
          <CardBody className="space-y-3">
            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-slate-500 mt-2 mb-2">Imagens do plano sagital</div>
              <div className="grid grid-cols-3 gap-3">
                {IMAGENS_SAGITAL.map(([key, label]) => (
                  <div key={key} className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="text-xs font-semibold text-slate-600">{label}</div>
                    <Input type="file" accept="image/*"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) uploadGrafico(key as keyof typeof graficos, file);
                      }} />
                    <Input value={(graficos as any)[key]}
                      onChange={e => setGraficos(g => ({ ...g, [key]: e.target.value }))}
                      placeholder="Ou cole a URL da imagem" />
                    {(graficos as any)[key] && (
                      <div className="w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-950" style={{ aspectRatio: '9 / 14' }}>
                        <img src={(graficos as any)[key]} alt={label} className="h-full w-full object-contain" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            {(Object.entries(ANGULOS_REF) as [string, {plano:string;label:string;min:number;max:number}][]).map(([key, ref], index, all) => {
              const val = parseFloat(angulos[key]);
              const cls = !isNaN(val) ? classAngle(val, ref.min, ref.max) : null;
              const showPlano = index === 0 || all[index - 1][1].plano !== ref.plano;
              return (
                <div key={key}>
                  {showPlano && <div className="text-xs font-bold uppercase tracking-wide text-slate-500 mt-2 mb-2">{ref.plano}</div>}
                  {showPlano && ref.plano === 'Plano posterior' && (
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      {IMAGENS_POSTERIOR.map(([imgKey, label]) => (
                        <div key={imgKey} className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                          <div className="text-xs font-semibold text-slate-600">{label}</div>
                          <Input type="file" accept="image/*"
                            onChange={e => {
                              const file = e.target.files?.[0];
                              if (file) uploadGrafico(imgKey as keyof typeof graficos, file);
                            }} />
                          <Input value={(graficos as any)[imgKey]}
                            onChange={e => setGraficos(g => ({ ...g, [imgKey]: e.target.value }))}
                            placeholder="Ou cole a URL da imagem" />
                          {(graficos as any)[imgKey] && (
                            <div className="w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-950" style={{ aspectRatio: '16 / 9' }}>
                              <img src={(graficos as any)[imgKey]} alt={label} className="h-full w-full object-contain" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className={`rounded-lg p-3 border transition-colors ${cls ? CLS_BG[cls] : 'border-slate-100 bg-slate-50/50'}`}>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="text-xs font-semibold text-slate-600 mb-1.5">{ref.label}</div>
                        <div className="flex items-center gap-3">
                          <Input type="number" step="0.1" value={angulos[key]}
                            onChange={e => setAngulos(a => ({ ...a, [key]: e.target.value }))}
                            className="w-28 text-sm" placeholder="°" />
                          <span className="text-xs text-slate-400">
                            Ideal: {ref.min}° a {ref.max}°
                          </span>
                        </div>
                      </div>
                      {cls && (
                        <div className={`text-sm font-semibold flex items-center gap-1.5 flex-shrink-0 ${CLS_COLOR[cls]}`}>
                          {cls === 'ideal'
                            ? <CheckCircle className="w-4 h-4" />
                            : <AlertTriangle className="w-4 h-4" />}
                          {CLS_LABEL[cls]}
                        </div>
                      )}
                    </div>
                    <Textarea
                      value={comentariosAngulos[key] ?? ''}
                      onChange={e => setComentariosAngulos(c => ({ ...c, [key]: e.target.value }))}
                      placeholder="Análise e comentários deste ponto observado"
                      className="mt-3 min-h-[72px]"
                    />
                  </div>
                </div>
              );
            })}
          </CardBody>
        </Card>

        {/* Achados clínicos */}
        <Card>
          <CardHeader><CardTitle>Achados clínicos</CardTitle></CardHeader>
          <CardBody className="space-y-3">
            {([
              ['mecanica_frenagem',       'Mecânica de frenagem (overstride)'],
              ['sobrecarga_articular',    'Sobrecarga articular e muscular'],
              ['deslocamento_cg',         'Deslocamento do centro de gravidade'],
              ['ineficiencia_propulsiva', 'Ineficiência propulsiva'],
            ] as [string, string][]).map(([key, label]) => (
              <label key={key} className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-slate-50">
                <input type="checkbox" checked={(achados as any)[key]}
                  onChange={e => setAchados(a => ({ ...a, [key]: e.target.checked }))}
                  className="w-4 h-4 accent-brand-600" />
                <span className="text-sm text-slate-700">{label}</span>
              </label>
            ))}
            <Field label="Pontos de atenção e risco">
              <Textarea value={achados.comentarios_risco}
                onChange={e => setAchados(a => ({ ...a, comentarios_risco: e.target.value }))}
                placeholder="Descreva livremente os riscos, compensações e pontos que merecem atenção" />
            </Field>
            <Field label="Observações clínicas">
              <textarea value={achados.observacoes}
                onChange={e => setAchados(a => ({ ...a, observacoes: e.target.value }))}
                rows={3} className="w-full rounded-lg border border-slate-200 p-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent" />
            </Field>
          </CardBody>
        </Card>

        {/* Recomendações */}
        <Card>
          <CardHeader><CardTitle>Recomendações</CardTitle></CardHeader>
          <CardBody className="space-y-3">
            {([
              ['correcao_postura',    'Correção de postura'],
              ['ajuste_passada',      'Ajuste de passada'],
              ['exercicios_dinamicos','Exercícios dinâmicos'],
              ['complementos',        'Complementos'],
            ] as [string, string][]).map(([key, label]) => (
              <Field key={key} label={label}>
                <textarea value={(recomendacoes as any)[key]}
                  onChange={e => setRec(r => ({ ...r, [key]: e.target.value }))}
                  rows={2} className="w-full rounded-lg border border-slate-200 p-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent" />
              </Field>
            ))}
          </CardBody>
        </Card>

        {/* Gráficos */}
        <Card>
          <CardHeader>
            <CardTitle>Gráficos cinemáticos</CardTitle>
            <p className="text-xs text-slate-500 mt-1">Envie os prints exportados pelo software de cinemática 2D</p>
          </CardHeader>
          <CardBody className="space-y-3">
            {([
              ['ombro_url', 'Grafico 1 - Ombro'],
              ['cotovelo_url', 'Grafico 2 - Cotovelo'],
              ['quadril_url', 'Grafico 3 - Quadril'],
              ['joelho_url', 'Grafico 4 - Joelho'],
              ['tornozelo_url', 'Grafico 5 - Tornozelo'],
            ] as [string, string][]).map(([key, label]) => (
              <Field key={key} label={label}>
                <div className="space-y-2">
                  <Input type="file" accept="image/*"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) uploadGrafico(key as keyof typeof graficos, file);
                    }} />
                  <Input value={(graficos as any)[key]}
                    onChange={e => setGraficos(g => ({ ...g, [key]: e.target.value }))}
                    placeholder="Ou cole a URL da imagem" />
                  {(graficos as any)[key] && (
                    <div className="w-full max-w-xl overflow-hidden rounded-lg border border-slate-200 bg-slate-950" style={{ aspectRatio: '544 / 443' }}>
                      <img src={(graficos as any)[key]} alt={label}
                        className="h-full w-full object-contain" />
                    </div>
                  )}
                </div>
              </Field>
            ))}
            <Field label="Comentário geral dos gráficos">
              <Textarea
                value={comentarioGraficos}
                onChange={e => setComentarioGraficos(e.target.value)}
                placeholder="Comentários gerais sobre as imagens dos gráficos cinemáticos"
              />
            </Field>
          </CardBody>
        </Card>

        <div className="flex justify-end">
          <Button onClick={async () => {
            try {
              await salvar();
            } catch (error: any) {
              alert(error?.message ?? 'Nao foi possivel salvar a biomecanica.');
              return;
            }
            const st = buildSteps(params.id, aval.modulos_selecionados);
            const nx = st.find(s => s.key === 'revisao');
            router.push(nx?.href ?? `/avaliacoes/${params.id}/revisao`);
          }}>Continuar →</Button>
        </div>
      </div>
    </div>
  );
}
