'use client';
import { useState } from 'react';
import { MODULOS_REFERENCIAS, referenciasAvaliacao } from '@/lib/clinical/references';
import { createClient } from '@/lib/supabase/client';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Field } from '@/components/ui/Input';
import {
  Save, Plus, Trash2, GripVertical, FileText, BookOpen, AlertCircle, Check, Loader2
} from 'lucide-react';

interface Protocolo { id: string; label: string; texto: string; }
interface Referencia { id: string; texto: string; }

interface PdfConfig {
  id?: string;
  clinica_id: string;
  protocolos: Protocolo[];
  referencias: Referencia[];
  texto_legal: string;
  nota_equipamentos?: string | null;
}

const DEFAULTS: Omit<PdfConfig, 'clinica_id'> = {
  protocolos: [
    { id: 'antropometria', label: 'Antropometria', texto: 'Padrão ISAK' },
    { id: 'gordura', label: '% Gordura', texto: 'Durnin-Womersley + Siri (V2); Jackson-Pollock 7 dobras + Siri apenas em avaliações históricas completas' },
    { id: 'ossea', label: 'Massa óssea', texto: 'Von Döbeln (Rocha, 1974)' },
    { id: 'somatotipo', label: 'Somatotipo', texto: 'Heath-Carter' },
    { id: 'preensao', label: 'Preensão palmar', texto: 'Dinamômetro Medeor (Massy-Westropp, 2011)' },
    { id: 'dinamometria', label: 'Dinamometria isométrica', texto: 'SP Tech / Medeor (protocolo interno)' },
    { id: 'flexibilidade', label: 'Flexibilidade', texto: 'Banco de Wells (ACSM)' },
    { id: 'aerobico', label: 'Aeróbico', texto: 'Zonas % FCmáx (Tanaka, 2001)' },
    { id: 'ffmi', label: 'FFMI', texto: 'Índice descritivo de massa livre de gordura por estatura; não estima potencial genético' },
    { id: 'termografia', label: 'Termografia funcional', texto: 'Protocolo TISEM; emissividade cutânea 0,98; análise comparativa por ROIs' },
  ],
  referencias: [],
  texto_legal: 'Este documento é um relatório técnico e não substitui diagnóstico ou prescrição médica.',
  nota_equipamentos: '',
};

function uid() { return Math.random().toString(36).slice(2, 8); }
function protocoloSeguro(protocolo: Protocolo): Protocolo {
  return /ffmi/i.test(protocolo.label) && /berkhan|mcdonald|limite|potencial/i.test(protocolo.texto)
    ? { ...protocolo, texto: 'Índice descritivo de massa livre de gordura por estatura; não estima potencial genético' }
    : protocolo;
}

export function PdfConfigForm({ clinicaId, config }: { clinicaId: string; config: PdfConfig | null }) {
  const supabase = createClient();
  const base = config ?? { ...DEFAULTS, clinica_id: clinicaId };

  const [protocolos, setProtocolos] = useState<Protocolo[]>(() => (base.protocolos ?? DEFAULTS.protocolos).map(protocoloSeguro));
  const referencias = base.referencias ?? DEFAULTS.referencias;
  const [textoLegal, setTextoLegal] = useState(base.texto_legal ?? DEFAULTS.texto_legal);
  const [notaEquip, setNotaEquip] = useState(base.nota_equipamentos ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // ── Protocolos ──
  function updProto(idx: number, field: 'label' | 'texto', val: string) {
    setProtocolos(p => p.map((x, i) => i === idx ? { ...x, [field]: val } : x));
  }
  function addProto() {
    setProtocolos(p => [...p, { id: uid(), label: '', texto: '' }]);
  }
  function rmProto(idx: number) {
    setProtocolos(p => p.filter((_, i) => i !== idx));
  }

  // ── Salvar ──
  async function salvar() {
    setSaving(true); setErr(null); setSaved(false);
    const payload = {
      clinica_id: clinicaId,
      protocolos,
      referencias,
      texto_legal: textoLegal,
      nota_equipamentos: notaEquip || null,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase
      .from('pdf_config')
      .upsert(payload, { onConflict: 'clinica_id' });

    if (error) { setErr(error.message); }
    else { setSaved(true); setTimeout(() => setSaved(false), 3000); }
    setSaving(false);
  }

  // ── Restaurar padrões ──
  function restaurar() {
    if (!confirm('Restaurar protocolos e textos para os valores padrão?')) return;
    setProtocolos(DEFAULTS.protocolos);
    setTextoLegal(DEFAULTS.texto_legal);
    setNotaEquip('');
  }

  return (
    <div className="space-y-6">

      {/* ── Protocolos ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand-600" />
              Protocolos utilizados
            </CardTitle>
            <Button size="sm" variant="secondary" onClick={addProto}>
              <Plus className="w-4 h-4" /> Adicionar
            </Button>
          </div>
        </CardHeader>
        <CardBody>
          <p className="text-xs text-slate-500 mb-4">
            Estes protocolos aparecem na última página do laudo PDF. Edite o texto de cada um ou adicione novos.
          </p>
          <div className="space-y-2">
            {protocolos.map((p, i) => (
              <div key={p.id} className="flex items-center gap-2 group">
                <GripVertical className="w-4 h-4 text-slate-300 flex-shrink-0" />
                <Input
                  value={p.label}
                  onChange={e => updProto(i, 'label', e.target.value)}
                  placeholder="Nome do protocolo"
                  className="w-44 flex-shrink-0 text-sm"
                />
                <span className="text-slate-300 flex-shrink-0">—</span>
                <Input
                  value={p.texto}
                  onChange={e => updProto(i, 'texto', e.target.value)}
                  placeholder="Descrição / referência"
                  className="flex-1 text-sm"
                />
                <button
                  onClick={() => rmProto(i)}
                  className="p-1.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                  title="Remover"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><BookOpen className="w-5 h-5 text-brand-600" />Referências por módulo</CardTitle></CardHeader>
        <CardBody>
          {Object.entries(MODULOS_REFERENCIAS).map(([modulo, label]) => <details key={modulo} className="border-b border-slate-200 py-3">
            <summary className="cursor-pointer font-semibold text-sm">{label}</summary>
            <ul className="mt-3 space-y-3 text-xs text-slate-600">
              {referenciasAvaliacao({ [modulo]: true }).map(ref => <li key={ref.id}>
                <a href={ref.url} target="_blank" rel="noopener noreferrer" className="underline break-words">{ref.texto}</a>
              </li>)}
            </ul>
          </details>)}
          {referencias.length > 0 && <details className="mt-4 text-xs text-slate-500">
            <summary className="cursor-pointer">Arquivo da configuração anterior (não publicado)</summary>
            <ul className="mt-2 space-y-2">{referencias.map((ref, i) => <li key={i}>{ref.texto}</li>)}</ul>
          </details>}
        </CardBody>
      </Card>

      {/* ── Textos ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-brand-600" />
            Textos do laudo
          </CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          <Field label="Texto legal / aviso (rodapé da última página)">
            <textarea
              value={textoLegal}
              onChange={e => setTextoLegal(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </Field>
          <Field label="Nota sobre equipamentos (opcional — aparece na seção de protocolos)">
            <textarea
              value={notaEquip}
              onChange={e => setNotaEquip(e.target.value)}
              rows={2}
              placeholder="Ex: Equipamentos calibrados conforme certificado INMETRO nº..."
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </Field>
        </CardBody>
      </Card>

      {/* ── Ações ── */}
      {err && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {err}
        </p>
      )}

      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={restaurar} className="text-slate-500">
          Restaurar padrões
        </Button>
        <Button onClick={salvar} disabled={saving}>
          {saving
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando…</>
            : saved
              ? <><Check className="w-4 h-4 text-emerald-400" /> Salvo!</>
              : <><Save className="w-4 h-4" /> Salvar configurações</>
          }
        </Button>
      </div>
    </div>
  );
}
