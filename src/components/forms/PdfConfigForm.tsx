'use client';
import { useState } from 'react';
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
    { id: 'gordura', label: '% Gordura', texto: 'Jackson & Pollock 7 dobras + Siri' },
    { id: 'ossea', label: 'Massa óssea', texto: 'Von Döbeln (Rocha, 1974)' },
    { id: 'somatotipo', label: 'Somatotipo', texto: 'Heath-Carter' },
    { id: 'preensao', label: 'Preensão palmar', texto: 'Dinamômetro Medeor (Massy-Westropp, 2011)' },
    { id: 'dinamometria', label: 'Dinamometria isométrica', texto: 'SP Tech / Medeor (protocolo interno)' },
    { id: 'flexibilidade', label: 'Flexibilidade', texto: 'Banco de Wells (ACSM)' },
    { id: 'aerobico', label: 'Aeróbico', texto: 'Zonas % FCmáx (Tanaka, 2001)' },
    { id: 'ffmi', label: 'FFMI', texto: 'Schutz 2002; limite: Berkhan/McDonald' },
  ],
  referencias: [
    { id: 'jackson', texto: 'Jackson & Pollock. Br J Nutr. 1978;40(3):497–504.' },
    { id: 'siri', texto: 'Siri WE. Univ. of California; 1961.' },
    { id: 'carter', texto: 'Carter & Heath. Somatotyping. Cambridge; 1990.' },
    { id: 'tanaka', texto: 'Tanaka et al. J Am Coll Cardiol. 2001;37(1):153–6.' },
    { id: 'stewart', texto: 'Stewart et al. ISAK Standards; 2011.' },
    { id: 'leong', texto: 'Leong et al. Lancet. 2015;386:266–273.' },
    { id: 'medeor', texto: 'Medeor Ltda. Manual técnico do dinamômetro isométrico Medeor. São Paulo; 2019.' },
    { id: 'massy', texto: 'Massy-Westropp NM et al. Hand Grip Strength normative data. BMC Res Notes. 2011;4:127.' },
  ],
  texto_legal: 'Este documento é um relatório técnico e não substitui diagnóstico ou prescrição médica.',
  nota_equipamentos: '',
};

function uid() { return Math.random().toString(36).slice(2, 8); }

export function PdfConfigForm({ clinicaId, config }: { clinicaId: string; config: PdfConfig | null }) {
  const supabase = createClient();
  const base = config ?? { ...DEFAULTS, clinica_id: clinicaId };

  const [protocolos, setProtocolos] = useState<Protocolo[]>(base.protocolos ?? DEFAULTS.protocolos);
  const [referencias, setReferencias] = useState<Referencia[]>(base.referencias ?? DEFAULTS.referencias);
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

  // ── Referências ──
  function updRef(idx: number, val: string) {
    setReferencias(r => r.map((x, i) => i === idx ? { ...x, texto: val } : x));
  }
  function addRef() {
    setReferencias(r => [...r, { id: uid(), texto: '' }]);
  }
  function rmRef(idx: number) {
    setReferencias(r => r.filter((_, i) => i !== idx));
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
    const { error } = config?.id
      ? await supabase.from('pdf_config').update(payload).eq('id', config.id)
      : await supabase.from('pdf_config').insert(payload);

    if (error) { setErr(error.message); }
    else { setSaved(true); setTimeout(() => setSaved(false), 3000); }
    setSaving(false);
  }

  // ── Restaurar padrões ──
  function restaurar() {
    if (!confirm('Restaurar todos os protocolos e referências para os valores padrão?')) return;
    setProtocolos(DEFAULTS.protocolos);
    setReferencias(DEFAULTS.referencias);
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

      {/* ── Referências ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-brand-600" />
              Referências bibliográficas
            </CardTitle>
            <Button size="sm" variant="secondary" onClick={addRef}>
              <Plus className="w-4 h-4" /> Adicionar
            </Button>
          </div>
        </CardHeader>
        <CardBody>
          <p className="text-xs text-slate-500 mb-4">
            Lista numerada de referências que aparece na última página do laudo.
          </p>
          <div className="space-y-2">
            {referencias.map((r, i) => (
              <div key={r.id} className="flex items-center gap-2 group">
                <span className="text-xs text-slate-400 w-5 text-right flex-shrink-0 font-mono">{i + 1}.</span>
                <Input
                  value={r.texto}
                  onChange={e => updRef(i, e.target.value)}
                  placeholder="Autor. Título. Periódico. Ano;vol:pág."
                  className="flex-1 text-sm"
                />
                <button
                  onClick={() => rmRef(i)}
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
