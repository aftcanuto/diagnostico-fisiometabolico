'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Field, Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Save, Upload, Check } from 'lucide-react';

export function ClinicaBrandingForm({ clinica, podeEditar }: { clinica: any; podeEditar: boolean }) {
  const supabase = createClient();
  const [form, setForm] = useState<any>({
    nome: clinica.nome ?? '',
    cnpj: clinica.cnpj ?? '',
    telefone: clinica.telefone ?? '',
    email: clinica.email ?? '',
    endereco: clinica.endereco ?? '',
    site: clinica.site ?? '',
    instagram: clinica.instagram ?? '',
    logo_url: clinica.logo_url ?? '',
    cor_primaria: clinica.cor_primaria ?? '#1854ed',
    cor_secundaria: clinica.cor_secundaria ?? '#0b1f5b',
    cor_gradient_1: clinica.cor_gradient_1 ?? '#0b1f5b',
    cor_gradient_2: clinica.cor_gradient_2 ?? '#1854ed',
    cor_gradient_3: clinica.cor_gradient_3 ?? '#2f72ff',
  });
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [salvo, setSalvo] = useState(false);

  async function uploadLogo(file: File) {
    setUploadingLogo(true);
    try {
      const ext = (file.name.split('.').pop() || 'png').toLowerCase();
      const path = `${clinica.id}/logo_${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('branding').upload(path, file, {
        upsert: true,
        contentType: file.type,
      });
      if (error) throw error;
      const { data } = supabase.storage.from('branding').getPublicUrl(path);
      setForm((f: any) => ({ ...f, logo_url: data.publicUrl }));
    } catch (e: any) {
      alert('Falha ao enviar logo: ' + e.message);
    } finally {
      setUploadingLogo(false);
    }
  }

  async function salvar() {
    setSaving(true); setSalvo(false);
    const { error } = await supabase.from('clinicas').update(form).eq('id', clinica.id);
    setSaving(false);
    if (error) { alert(error.message); return; }
    setSalvo(true); setTimeout(() => setSalvo(false), 2500);
  }

  return (
    <Card>
      <CardHeader><CardTitle>Identidade & contato</CardTitle></CardHeader>
      <CardBody className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Nome da clínica">
            <Input disabled={!podeEditar} value={form.nome} onChange={e => setForm((f: any) => ({ ...f, nome: e.target.value }))} />
          </Field>
          <Field label="CNPJ"><Input disabled={!podeEditar} value={form.cnpj} onChange={e => setForm((f: any) => ({ ...f, cnpj: e.target.value }))} /></Field>
          <Field label="Telefone"><Input disabled={!podeEditar} value={form.telefone} onChange={e => setForm((f: any) => ({ ...f, telefone: e.target.value }))} /></Field>
          <Field label="E-mail"><Input disabled={!podeEditar} value={form.email} onChange={e => setForm((f: any) => ({ ...f, email: e.target.value }))} /></Field>
          <Field label="Site"><Input disabled={!podeEditar} value={form.site} onChange={e => setForm((f: any) => ({ ...f, site: e.target.value }))} /></Field>
          <Field label="Instagram"><Input disabled={!podeEditar} value={form.instagram} onChange={e => setForm((f: any) => ({ ...f, instagram: e.target.value }))} /></Field>
          <Field label="Endereço"><Input disabled={!podeEditar} value={form.endereco} onChange={e => setForm((f: any) => ({ ...f, endereco: e.target.value }))} /></Field>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Logotipo</label>
          <div className="flex items-center gap-4">
            {form.logo_url ? (
              <img src={form.logo_url} alt="logo" className="w-20 h-20 object-contain rounded-lg border border-slate-200 bg-white" />
            ) : (
              <div className="w-20 h-20 rounded-lg border-2 border-dashed border-slate-300 grid place-items-center text-xs text-slate-400">sem logo</div>
            )}
            {podeEditar && (
              <label className="cursor-pointer">
                <span className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-4 h-10 text-sm">
                  <Upload className="w-4 h-4" /> {uploadingLogo ? 'Enviando…' : 'Enviar logo'}
                </span>
                <input type="file" accept="image/*" className="hidden"
                  onChange={e => e.target.files?.[0] && uploadLogo(e.target.files[0])} />
              </label>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-2">PNG ou JPG, idealmente quadrado.</p>
        </div>

        <div>
          <div className="text-sm font-medium text-slate-700 mb-2">Cores da marca (aplicadas ao PDF e ao portal)</div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <ColorField label="Primária" value={form.cor_primaria} onChange={v => setForm((f: any) => ({ ...f, cor_primaria: v }))} disabled={!podeEditar} />
            <ColorField label="Secundária" value={form.cor_secundaria} onChange={v => setForm((f: any) => ({ ...f, cor_secundaria: v }))} disabled={!podeEditar} />
            <ColorField label="Gradiente 1" value={form.cor_gradient_1} onChange={v => setForm((f: any) => ({ ...f, cor_gradient_1: v }))} disabled={!podeEditar} />
            <ColorField label="Gradiente 2" value={form.cor_gradient_2} onChange={v => setForm((f: any) => ({ ...f, cor_gradient_2: v }))} disabled={!podeEditar} />
            <ColorField label="Gradiente 3" value={form.cor_gradient_3} onChange={v => setForm((f: any) => ({ ...f, cor_gradient_3: v }))} disabled={!podeEditar} />
          </div>
          <div className="mt-3 rounded-lg h-16"
               style={{ background: `linear-gradient(135deg, ${form.cor_gradient_1} 0%, ${form.cor_gradient_2} 60%, ${form.cor_gradient_3} 100%)` }}
          />
          <p className="text-xs text-slate-500 mt-2">Pré-visualização do gradiente da capa do PDF.</p>
        </div>

        {podeEditar && (
          <div className="flex justify-end items-center gap-3">
            {salvo && <span className="text-sm text-emerald-600 inline-flex items-center gap-1"><Check className="w-4 h-4" /> Salvo</span>}
            <Button onClick={salvar} disabled={saving}>
              <Save className="w-4 h-4" /> {saving ? 'Salvando…' : 'Salvar alterações'}
            </Button>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function ColorField({ label, value, onChange, disabled }: {
  label: string; value: string; onChange: (v: string) => void; disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs text-slate-500 mb-1">{label}</label>
      <div className="flex gap-2">
        <input
          type="color" disabled={disabled}
          value={value} onChange={e => onChange(e.target.value)}
          className="h-10 w-12 rounded border border-slate-200 cursor-pointer"
        />
        <input
          type="text" disabled={disabled}
          value={value} onChange={e => onChange(e.target.value)}
          className="flex-1 h-10 rounded-lg border border-slate-200 px-2 text-sm font-mono"
        />
      </div>
    </div>
  );
}
