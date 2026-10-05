'use client';
import { PUBLIC_APP_ORIGIN } from '@/lib/public-origin';

import { useEffect, useState } from 'react';
import { Clipboard, Download, FileText, Link2, Loader2, Send, X } from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export function DocumentosPreTesteAvulsos() {
  const [dados, setDados] = useState<any>({ anamneses: [], consentimentos: [], recomendacoes: [], envios: [] });
  const [tipo, setTipo] = useState('anamnese');
  const [modeloId, setModeloId] = useState('');
  const [selecionados, setSelecionados] = useState<Record<string, boolean>>({});
  const [nome, setNome] = useState('');
  const [contato, setContato] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [revogando, setRevogando] = useState<string | null>(null);
  const [erro, setErro] = useState('');
  const origin = PUBLIC_APP_ORIGIN;

  async function carregar() {
    setCarregando(true);
    const response = await fetch('/api/documentos-pre-teste', { cache: 'no-store' });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) setErro(body.error ?? 'Não foi possível carregar os documentos.');
    else {
      setDados(body);
      setModeloId((atual) => atual || body.anamneses?.[0]?.id || '');
    }
    setCarregando(false);
  }

  useEffect(() => { carregar(); }, []);

  function trocarTipo(novoTipo: string) {
    setTipo(novoTipo);
    setModeloId(novoTipo === 'anamnese' ? dados.anamneses?.[0]?.id ?? '' : novoTipo === 'consentimento' ? dados.consentimentos?.[0]?.id ?? '' : '');
  }

  async function gerar() {
    setSalvando(true); setErro('');
    const recomendacoesIds = Object.entries(selecionados).filter(([, ativo]) => ativo).map(([id]) => id);
    const response = await fetch('/api/documentos-pre-teste', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo, modeloId, recomendacoesIds, destinatarioNome: nome, destinatarioContato: contato }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) setErro(body.error ?? 'Não foi possível gerar o link.');
    else {
      setNome(''); setContato(''); setSelecionados({});
      await carregar();
      await copiar(`${origin}/pre-atendimento/documento/${body.data.token}`);
    }
    setSalvando(false);
  }

  async function revogar(id: string) {
    if (!confirm('Revogar este link? Ele deixará de funcionar imediatamente.')) return;
    setRevogando(id); setErro('');
    const response = await fetch('/api/documentos-pre-teste', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) setErro(body.error ?? 'Não foi possível revogar o link.');
    else setDados((atual: any) => ({ ...atual, envios: atual.envios.filter((envio: any) => envio.id !== id) }));
    setRevogando(null);
  }

  async function copiar(url: string) {
    await navigator.clipboard.writeText(url);
  }

  const modelos = tipo === 'anamnese' ? dados.anamneses : dados.consentimentos;
  const podeGerar = tipo === 'recomendacoes' ? Object.values(selecionados).some(Boolean) : Boolean(modeloId);

  return (
    <Card>
      <CardHeader>
        <CardTitle><Send className="inline h-4 w-4 mr-1 text-brand-600" /> Documentos pré-teste avulsos</CardTitle>
      </CardHeader>
      <CardBody className="space-y-4">
        <p className="text-sm text-slate-500">Envie modelos do sistema mesmo antes de cadastrar o cliente. O link pode ser copiado para WhatsApp, e-mail ou outro canal.</p>
        {carregando ? <div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Carregando...</div> : (
          <>
            <div className="grid gap-3 md:grid-cols-3">
              <Campo label="Nome do destinatário (opcional)" value={nome} onChange={setNome} placeholder="Ex.: João Silva" />
              <Campo label="Contato (opcional)" value={contato} onChange={setContato} placeholder="E-mail ou telefone" />
              <label className="text-xs font-semibold text-slate-600">Tipo de documento
                <select value={tipo} onChange={(e) => trocarTipo(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm">
                  <option value="anamnese">Anamnese</option>
                  <option value="consentimento">Consentimento / TCLE</option>
                  <option value="recomendacoes">Recomendações</option>
                </select>
              </label>
            </div>
            {tipo !== 'recomendacoes' ? (
              <label className="text-xs font-semibold text-slate-600">Modelo
                <select value={modeloId} onChange={(e) => setModeloId(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm">
                  {modelos.map((modelo: any) => <option key={modelo.id} value={modelo.id}>{modelo.nome}</option>)}
                  {!modelos.length && <option value="">Nenhum modelo ativo</option>}
                </select>
              </label>
            ) : (
              <div className="grid gap-2 md:grid-cols-2">
                {dados.recomendacoes.map((item: any) => (
                  <label key={item.id} className="flex items-start gap-2 rounded-lg border border-slate-200 p-3 text-sm">
                    <input type="checkbox" checked={Boolean(selecionados[item.id])} onChange={(e) => setSelecionados(v => ({ ...v, [item.id]: e.target.checked }))} />
                    <span><b>{item.titulo}</b>{item.modulo && <span className="block text-xs text-slate-400">{String(item.modulo).replaceAll('_', ' ')}</span>}</span>
                  </label>
                ))}
              </div>
            )}
            <Button onClick={gerar} disabled={salvando || !podeGerar}>{salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />} Gerar e copiar link</Button>
          </>
        )}
        {erro && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{erro}</div>}
        {dados.envios?.length > 0 && <div className="border-t border-slate-100 pt-4">
          <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Links recentes</div>
          <div className="space-y-2">{dados.envios.map((envio: any) => {
            const url = `${origin}/pre-atendimento/documento/${envio.token}`;
            const concluido = Boolean(envio.respondido_em || envio.aceito_em);
            const comprovanteUrl = envio.aceite
              ? `/api/documentos-pre-teste-comprovante?id=${encodeURIComponent(envio.id)}`
              : null;
            return <div key={envio.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm">
              <div className="min-w-0">
                <div><FileText className="mr-2 inline h-4 w-4 text-brand-600" /><b>{envio.destinatario_nome || 'Uso avulso'}</b> · {labelTipo(envio.tipo)}<span className="ml-2 text-xs text-slate-400">{concluido ? 'Concluído' : 'Aguardando'}</span></div>
                {envio.aceite && <div className="mt-1 truncate font-mono text-[11px] text-emerald-700">
                  {envio.aceite.comprovante_codigo} · {envio.aceite.nivel_evidencia === 'parcial_legado' ? 'evidência parcial' : 'evidência completa'}
                </div>}
              </div>
              <div className="flex flex-wrap gap-1">
                <Button size="sm" variant="ghost" onClick={() => copiar(url)}><Clipboard className="h-3 w-3" /> {concluido ? 'Copiar acesso' : 'Copiar'}</Button>
                {comprovanteUrl && <a href={comprovanteUrl} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium text-brand-700 transition hover:bg-brand-50"><Download className="h-3 w-3" /> Comprovante</a>}
                {!concluido && !envio.revogado && <Button size="sm" variant="ghost" disabled={revogando === envio.id} onClick={() => revogar(envio.id)}>{revogando === envio.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />} {revogando === envio.id ? 'Revogando...' : 'Revogar link'}</Button>}
              </div>
            </div>;
          })}</div>
        </div>}
      </CardBody>
    </Card>
  );
}

function Campo({ label, value, onChange, placeholder }: any) {
  return <label className="text-xs font-semibold text-slate-600">{label}<input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" /></label>;
}

function labelTipo(tipo: string) {
  return tipo === 'anamnese' ? 'Anamnese' : tipo === 'consentimento' ? 'Consentimento' : 'Recomendações';
}
