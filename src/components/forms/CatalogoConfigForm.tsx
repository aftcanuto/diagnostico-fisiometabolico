'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Save, Check, ArrowLeft, ExternalLink } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Field, Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

type Props = {
  clinica: any;
  catalogoHref: string;
};

export function CatalogoConfigForm({ clinica, catalogoHref }: Props) {
  const supabase = createClient();
  const [form, setForm] = useState({
    catalogo_titulo: clinica?.catalogo_titulo ?? '',
    catalogo_subtitulo: clinica?.catalogo_subtitulo ?? '',
    catalogo_rodape_titulo: clinica?.catalogo_rodape_titulo ?? '',
    catalogo_rodape_texto: clinica?.catalogo_rodape_texto ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function salvar() {
    setSaving(true);
    setSaved(false);
    const { error } = await supabase
      .from('clinicas')
      .update(form)
      .eq('id', clinica.id);
    setSaving(false);
    if (error) {
      alert(error.message);
      return;
    }
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <Link href="/produtos" className="mb-3 inline-flex items-center gap-1 text-sm text-brand-600 hover:underline">
            <ArrowLeft className="h-4 w-4" /> Voltar para produtos
          </Link>
          <h1 className="text-2xl font-bold text-slate-800">Configuracao da vitrine</h1>
          <p className="mt-1 text-sm text-slate-500">
            Edite os textos de cabecalho e rodape da pagina publica de produtos.
          </p>
        </div>
        <Link href={catalogoHref} target="_blank">
          <Button variant="secondary" type="button">
            <ExternalLink className="h-4 w-4" /> Abrir vitrine
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Textos da pagina de vendas</CardTitle>
        </CardHeader>
        <CardBody className="space-y-5">
          <Field
            label="Titulo principal"
            hint="Se ficar vazio, o sistema usa o titulo padrao da vitrine."
          >
            <Input
              value={form.catalogo_titulo}
              onChange={e => setForm(f => ({ ...f, catalogo_titulo: e.target.value }))}
              placeholder="Ex: Avaliacoes completas para evoluir com seguranca"
            />
          </Field>

          <Field label="Texto de apoio do cabecalho">
            <Textarea
              value={form.catalogo_subtitulo}
              onChange={e => setForm(f => ({ ...f, catalogo_subtitulo: e.target.value }))}
              placeholder="Explique em poucas linhas o que o paciente encontra nesta pagina."
              rows={4}
            />
          </Field>

          <Field label="Titulo do rodape">
            <Input
              value={form.catalogo_rodape_titulo}
              onChange={e => setForm(f => ({ ...f, catalogo_rodape_titulo: e.target.value }))}
              placeholder="Ex: Fale com a nossa equipe"
            />
          </Field>

          <Field label="Texto do rodape">
            <Textarea
              value={form.catalogo_rodape_texto}
              onChange={e => setForm(f => ({ ...f, catalogo_rodape_texto: e.target.value }))}
              placeholder="Inclua uma chamada final para contato, agendamento ou duvidas."
              rows={4}
            />
          </Field>

          <div className="flex justify-end gap-3">
            {saved && (
              <span className="inline-flex items-center gap-1 text-sm text-emerald-600">
                <Check className="h-4 w-4" /> Salvo
              </span>
            )}
            <Button type="button" onClick={salvar} disabled={saving}>
              <Save className="h-4 w-4" /> {saving ? 'Salvando...' : 'Salvar textos'}
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
