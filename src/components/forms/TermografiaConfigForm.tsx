'use client';
import { useState } from 'react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Input';
import { createClient } from '@/lib/supabase/client';

export function TermografiaConfigForm({ clinicaId, config }: { clinicaId: string; config?: any }) {
  const [form, setForm] = useState({
    fabricante: config?.fabricante ?? 'HIKMICRO',
    modelo: config?.modelo ?? 'Pocket2',
    software: config?.software ?? 'HIKMICRO Analyzer',
  });
  const [salvando, setSalvando] = useState(false);
  async function salvar() {
    setSalvando(true);
    const { error } = await createClient().from('termografia_config').upsert(
      { clinica_id: clinicaId, ...form }, { onConflict: 'clinica_id' });
    setSalvando(false);
    alert(error ? error.message : 'Equipamento padrão salvo.');
  }
  return <Card>
    <CardHeader><CardTitle>Termografia funcional</CardTitle></CardHeader>
    <CardBody className="space-y-4">
      <p className="text-sm text-slate-500">Equipamento padrão copiado e preservado em cada coleta.</p>
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Fabricante"><Input value={form.fabricante} onChange={e => setForm(v => ({...v, fabricante:e.target.value}))}/></Field>
        <Field label="Modelo"><Input value={form.modelo} onChange={e => setForm(v => ({...v, modelo:e.target.value}))}/></Field>
        <Field label="Software"><Input value={form.software} onChange={e => setForm(v => ({...v, software:e.target.value}))}/></Field>
      </div>
      <div className="flex justify-end"><Button onClick={salvar} disabled={salvando}>{salvando?'Salvando...':'Salvar equipamento'}</Button></div>
    </CardBody>
  </Card>;
}
