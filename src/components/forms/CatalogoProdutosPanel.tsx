'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Field, Input, Textarea } from '@/components/ui/Input';
import { ArrowLeft, ImageIcon, Package, Plus, RotateCcw, Save, Trash2, Upload } from 'lucide-react';
import { CatalogoImagemEnquadrada } from '@/components/CatalogoImagemEnquadrada';

const VAZIO = {
  nome: '',
  subtitulo: '',
  descricao: '',
  selo: '',
  imagem_url: '',
  imagem_posicao_x: 50,
  imagem_posicao_y: 50,
  imagem_zoom: 100,
  itens_texto: '',
  beneficios_texto: '',
  pacote_itens_texto: '',
  duracao_minutos: '',
  preco: '',
  preco_sob_consulta: false,
  sinal_percentual: '0',
  whatsapp_texto: '',
  checkout_resumo_texto: '',
  politica_pagamento: '',
  mensagem_pos_pagamento: '',
  cupom_codigo: '',
  cupom_tipo: 'percentual',
  cupom_valor: '',
  cupom_ativo: false,
  cupom_validade: '',
  cupom_limite_usos: '',
  ativo: true,
  destaque: false,
  ordem: 0,
  exigir_data_agendamento: true,
  agenda_horarios: {},
  agenda_horarios_texto: '',
};

export function CatalogoProdutosPanel({ clinicaId, catalogoHref }: { clinicaId: string; catalogoHref: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [produtos, setProdutos] = useState<any[]>([]);
  const [selecionado, setSelecionado] = useState<any>(VAZIO);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [novaDataAgenda, setNovaDataAgenda] = useState('');
  const [novosHorariosAgenda, setNovosHorariosAgenda] = useState('');

  const carregar = useCallback(async () => {
    setErro(null);
    const { data, error } = await supabase
      .from('catalogo_produtos')
      .select('*')
      .eq('clinica_id', clinicaId)
      .order('destaque', { ascending: false })
      .order('ordem')
      .order('nome');
    if (error) {
      setErro(`Não foi possível carregar os produtos da vitrine: ${error.message}`);
      setProdutos([]);
      return;
    }
    setProdutos(data ?? []);
  }, [clinicaId, supabase]);

  useEffect(() => { carregar(); }, [carregar]);

  function editar(produto: any) {
    setSelecionado({
      ...VAZIO,
      ...produto,
      itens_texto: Array.isArray(produto.itens_inclusos) ? produto.itens_inclusos.join('\n') : '',
      beneficios_texto: Array.isArray(produto.beneficios) ? produto.beneficios.join('\n') : '',
      pacote_itens_texto: Array.isArray(produto.pacote_itens) ? produto.pacote_itens.join('\n') : '',
      duracao_minutos: produto.duracao_minutos ?? '',
      preco: produto.preco ?? '',
      preco_sob_consulta: !!produto.preco_sob_consulta,
      imagem_posicao_x: limitarPercentual(produto.imagem_posicao_x),
      imagem_posicao_y: limitarPercentual(produto.imagem_posicao_y),
      imagem_zoom: limitarZoom(produto.imagem_zoom),
      sinal_percentual: produto.sinal_percentual ?? '0',
      checkout_resumo_texto: produto.checkout_resumo_texto ?? '',
      politica_pagamento: produto.politica_pagamento ?? '',
      mensagem_pos_pagamento: produto.mensagem_pos_pagamento ?? '',
      cupom_codigo: produto.cupom_codigo ?? '',
      cupom_tipo: produto.cupom_tipo ?? 'percentual',
      cupom_valor: produto.cupom_valor ?? '',
      cupom_ativo: !!produto.cupom_ativo,
      cupom_validade: produto.cupom_validade ?? '',
      cupom_limite_usos: produto.cupom_limite_usos ?? '',
      agenda_horarios: normalizarAgendaHorarios(produto.agenda_horarios),
      agenda_horarios_texto: agendaParaTexto(produto.agenda_horarios),
    });
  }

  async function salvar() {
    setSalvando(true);
    setErro(null);
    const agendaHorarios = normalizarAgendaHorarios(textoParaAgenda(selecionado.agenda_horarios_texto));
    const payload = {
      clinica_id: clinicaId,
      nome: selecionado.nome?.trim(),
      subtitulo: selecionado.subtitulo?.trim() || null,
      descricao: selecionado.descricao?.trim() || null,
      selo: selecionado.selo?.trim() || null,
      imagem_url: selecionado.imagem_url?.trim() || null,
      imagem_posicao_x: limitarPercentual(selecionado.imagem_posicao_x),
      imagem_posicao_y: limitarPercentual(selecionado.imagem_posicao_y),
      imagem_zoom: limitarZoom(selecionado.imagem_zoom),
      itens_inclusos: linhas(selecionado.itens_texto),
      beneficios: linhas(selecionado.beneficios_texto),
      pacote_itens: linhas(selecionado.pacote_itens_texto),
      duracao_minutos: selecionado.duracao_minutos === '' ? null : Number(selecionado.duracao_minutos),
      preco: selecionado.preco === '' ? null : Number(selecionado.preco),
      preco_sob_consulta: !!selecionado.preco_sob_consulta,
      sinal_percentual: selecionado.sinal_percentual === '' ? 0 : Number(selecionado.sinal_percentual),
      whatsapp_texto: selecionado.whatsapp_texto?.trim() || null,
      checkout_resumo_texto: selecionado.checkout_resumo_texto?.trim() || null,
      politica_pagamento: selecionado.politica_pagamento?.trim() || null,
      mensagem_pos_pagamento: selecionado.mensagem_pos_pagamento?.trim() || null,
      cupom_codigo: selecionado.cupom_codigo?.trim().toUpperCase() || null,
      cupom_tipo: selecionado.cupom_tipo || 'percentual',
      cupom_valor: selecionado.cupom_valor === '' ? 0 : Number(selecionado.cupom_valor),
      cupom_ativo: !!selecionado.cupom_ativo,
      cupom_validade: selecionado.cupom_validade || null,
      cupom_limite_usos: selecionado.cupom_limite_usos === '' ? null : Number(selecionado.cupom_limite_usos),
      ativo: !!selecionado.ativo,
      destaque: !!selecionado.destaque,
      ordem: Number(selecionado.ordem || 0),
      exigir_data_agendamento: selecionado.exigir_data_agendamento !== false,
      agenda_horarios: agendaHorarios,
      agenda_dias_semana: diasDaAgenda(agendaHorarios),
      agenda_periodos: periodosDaAgenda(agendaHorarios),
    };
    const query = selecionado.id
      ? supabase.from('catalogo_produtos').update(payload).eq('id', selecionado.id)
      : supabase.from('catalogo_produtos').insert(payload);
    const { error } = await query;
    setSalvando(false);
    if (error) {
      setErro(`Não foi possível salvar: ${error.message}`);
      return;
    }
    setSelecionado(VAZIO);
    carregar();
  }

  async function excluir() {
    if (!selecionado.id || !confirm('Excluir este produto da vitrine?')) return;
    const { error } = await supabase.from('catalogo_produtos').delete().eq('id', selecionado.id);
    if (error) {
      setErro(`Não foi possível excluir: ${error.message}`);
      return;
    }
    setSelecionado(VAZIO);
    carregar();
  }

  async function uploadImagem(file: File) {
    setErro(null);
    const ext = file.name.split('.').pop() || 'png';
    const path = `${clinicaId}/catalogo-${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from('produto-imagens').upload(path, file, {
      upsert: true,
      contentType: file.type || 'image/png',
    });
    if (error) {
      setErro(`Não foi possível enviar a imagem: ${error.message}`);
      return;
    }
    const { data } = supabase.storage.from('produto-imagens').getPublicUrl(path);
    setSelecionado((s: any) => ({ ...s, imagem_url: data.publicUrl }));
  }

  const valorSinal = selecionado.preco_sob_consulta
    ? 0
    : calcularSinal(selecionado.preco, selecionado.sinal_percentual);
  const agendaPreview = useMemo(
    () => normalizarAgendaHorarios(textoParaAgenda(selecionado.agenda_horarios_texto)),
    [selecionado.agenda_horarios_texto]
  );

  function adicionarDataAgenda() {
    const data = normalizarDataAgenda(novaDataAgenda);
    const horarios = normalizarHorarios(novosHorariosAgenda);
    if (!data) {
      setErro('Informe uma data válida para adicionar horários.');
      return;
    }
    if (!horarios.length) {
      setErro('Informe pelo menos um horário válido, como 14:00 ou 18:30.');
      return;
    }

    const agendaAtual = normalizarAgendaHorarios(textoParaAgenda(selecionado.agenda_horarios_texto));
    agendaAtual[data] = [...new Set([...(agendaAtual[data] ?? []), ...horarios])].sort();
    setSelecionado((s: any) => ({ ...s, agenda_horarios_texto: agendaParaTexto(agendaAtual) }));
    setNovaDataAgenda('');
    setNovosHorariosAgenda('');
    setErro(null);
  }

  function removerDataAgenda(data: string) {
    const agendaAtual = normalizarAgendaHorarios(textoParaAgenda(selecionado.agenda_horarios_texto));
    delete agendaAtual[data];
    setSelecionado((s: any) => ({ ...s, agenda_horarios_texto: agendaParaTexto(agendaAtual) }));
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <Link href="/produtos" className="mb-2 inline-flex items-center gap-1 text-sm text-brand-600 hover:underline">
            <ArrowLeft className="h-4 w-4" /> Voltar para produtos
          </Link>
          <h1 className="text-2xl font-bold text-slate-800">Produtos da vitrine</h1>
          <p className="text-sm text-slate-500">Cadastre produtos comerciais independentes dos produtos usados nas avaliações.</p>
        </div>
        <Link href={catalogoHref} target="_blank"><Button variant="secondary">Abrir catálogo</Button></Link>
      </div>

      <div className="grid gap-5 lg:grid-cols-[320px,1fr]">
        <Card>
          <CardHeader><CardTitle><Package className="mr-1 inline h-4 w-4 text-brand-600" /> Produtos cadastrados</CardTitle></CardHeader>
          <CardBody className="space-y-2">
            <Button variant="secondary" className="w-full" onClick={() => setSelecionado(VAZIO)}>
              <Plus className="h-4 w-4" /> Novo produto comercial
            </Button>
            {produtos.map(produto => (
              <button
                key={produto.id}
                onClick={() => editar(produto)}
                className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${selecionado.id === produto.id ? 'border-brand-300 bg-brand-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
              >
                <div className="font-semibold text-slate-800">{produto.nome}</div>
                <div className="mt-0.5 text-xs text-slate-500">
                  {produto.destaque ? 'Destaque · ' : ''}{produto.ativo ? 'Ativo' : 'Inativo'}
                  {produto.preco_sob_consulta ? ' · Sob consulta' : produto.preco != null ? ` · ${moeda(produto.preco)}` : ''}
                </div>
              </button>
            ))}
            {produtos.length === 0 && <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">Nenhum produto comercial cadastrado.</div>}
          </CardBody>
        </Card>

        <Card>
          <CardHeader><CardTitle>{selecionado.id ? 'Editar produto da vitrine' : 'Novo produto da vitrine'}</CardTitle></CardHeader>
          <CardBody className="space-y-4">
            {erro && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{erro}</div>}
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nome *"><Input value={selecionado.nome ?? ''} onChange={e => setSelecionado((s: any) => ({ ...s, nome: e.target.value }))} /></Field>
              <Field label="Selo comercial"><Input value={selecionado.selo ?? ''} onChange={e => setSelecionado((s: any) => ({ ...s, selo: e.target.value }))} placeholder="Ex.: Mais completo, Performance" /></Field>
            </div>
            <Field label="Subtítulo"><Input value={selecionado.subtitulo ?? ''} onChange={e => setSelecionado((s: any) => ({ ...s, subtitulo: e.target.value }))} /></Field>
            <Field label="Descrição comercial"><Textarea value={selecionado.descricao ?? ''} onChange={e => setSelecionado((s: any) => ({ ...s, descricao: e.target.value }))} /></Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Itens inclusos, um por linha"><Textarea value={selecionado.itens_texto ?? ''} onChange={e => setSelecionado((s: any) => ({ ...s, itens_texto: e.target.value }))} /></Field>
              <Field label="Benefícios, um por linha"><Textarea value={selecionado.beneficios_texto ?? ''} onChange={e => setSelecionado((s: any) => ({ ...s, beneficios_texto: e.target.value }))} /></Field>
            </div>
            <Field label="Avaliações do pacote, uma por linha">
              <Textarea
                value={selecionado.pacote_itens_texto ?? ''}
                onChange={e => setSelecionado((s: any) => ({ ...s, pacote_itens_texto: e.target.value }))}
                placeholder={'Ex.: VO2 Max\nBiomecânica da corrida\nAntropometria'}
              />
            </Field>
            <div className="grid gap-4 md:grid-cols-4">
              <Field label="Duração (min)"><Input type="number" value={selecionado.duracao_minutos ?? ''} onChange={e => setSelecionado((s: any) => ({ ...s, duracao_minutos: e.target.value }))} /></Field>
              <Field label="Preço (R$)"><Input type="number" step="0.01" value={selecionado.preco ?? ''} disabled={!!selecionado.preco_sob_consulta} onChange={e => setSelecionado((s: any) => ({ ...s, preco: e.target.value }))} /></Field>
              <Field label="% do sinal"><Input type="number" min="0" max="100" step="0.01" value={selecionado.sinal_percentual ?? ''} disabled={!!selecionado.preco_sob_consulta} onChange={e => setSelecionado((s: any) => ({ ...s, sinal_percentual: e.target.value }))} /></Field>
              <Field label="Ordem"><Input type="number" value={selecionado.ordem ?? 0} onChange={e => setSelecionado((s: any) => ({ ...s, ordem: e.target.value }))} /></Field>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <label className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={!!selecionado.preco_sob_consulta}
                  onChange={e => setSelecionado((s: any) => ({ ...s, preco_sob_consulta: e.target.checked }))}
                />
                <span>
                  <span className="block font-semibold text-slate-800">Exibir preço sob consulta</span>
                  <span className="block text-slate-500">Substitui o valor na vitrine e direciona o cliente para contato, sem iniciar pagamento online.</span>
                </span>
              </label>
            </div>
            <div className={`rounded-lg border px-4 py-3 text-sm ${selecionado.preco_sob_consulta ? 'border-slate-200 bg-slate-50 text-slate-600' : 'border-emerald-100 bg-emerald-50 text-emerald-900'}`}>
              {selecionado.preco_sob_consulta
                ? 'Pagamento online desativado para este produto.'
                : <>Sinal calculado: <b>{valorSinal ? moeda(valorSinal) : 'R$ 0,00'}</b>. Este percentual será usado no pagamento.</>}
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <label className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={selecionado.exigir_data_agendamento !== false}
                  onChange={e => setSelecionado((s: any) => ({ ...s, exigir_data_agendamento: e.target.checked }))}
                />
                <span>
                  <span className="block font-semibold text-slate-800">Exigir data no pagamento</span>
                  <span className="block text-slate-500">
                    Ligado: cliente escolhe data e horário antes de pagar. Desligado: cliente paga e combina o horário pelo WhatsApp depois.
                  </span>
                </span>
              </label>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-1 font-semibold text-slate-800">Horários disponíveis por data</div>
              <p className="mb-3 text-xs text-slate-500">Informe apenas as datas que estarão abertas. Uma linha por data.</p>
              <div className="mb-4 grid gap-3 rounded-xl border border-slate-200 bg-white p-3 md:grid-cols-[180px,1fr,auto] md:items-end">
                <Field label="Data">
                  <Input type="date" value={novaDataAgenda} onChange={e => setNovaDataAgenda(e.target.value)} />
                </Field>
                <Field label="Horários">
                  <Input
                    value={novosHorariosAgenda}
                    onChange={e => setNovosHorariosAgenda(e.target.value)}
                    placeholder="Ex.: 14:00, 16:00"
                  />
                </Field>
                <Button type="button" variant="secondary" onClick={adicionarDataAgenda}>
                  <Plus className="h-4 w-4" /> Adicionar
                </Button>
              </div>
              {Object.keys(agendaPreview).length > 0 && (
                <div className="mb-4 space-y-2">
                  {Object.entries(agendaPreview).map(([data, horarios]) => (
                    <div key={data} className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm md:flex-row md:items-center md:justify-between">
                      <div>
                        <b className="text-slate-800">{formatarDataAgenda(data)}</b>
                        <span className="ml-2 text-slate-500">{horarios.join(', ')}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removerDataAgenda(data)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Remover data
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <Textarea
                value={selecionado.agenda_horarios_texto ?? ''}
                onChange={e => setSelecionado((s: any) => ({ ...s, agenda_horarios_texto: e.target.value }))}
                placeholder={'24/06/2026: 14:00, 16:00\n27/06/2026: 18:30, 20:00'}
                className="min-h-32"
              />
              <p className="mt-2 text-xs text-slate-500">
                O cliente só conseguirá escolher datas e horários cadastrados aqui.
              </p>
            </div>
            <Field label="Imagem da vitrine">
              <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                {selecionado.imagem_url ? (
                  <div className="space-y-4">
                    <div className="relative aspect-[16/9] overflow-hidden rounded-lg border border-slate-200 bg-[#EEF1ED]">
                      <CatalogoImagemEnquadrada
                        key={selecionado.imagem_url}
                        src={selecionado.imagem_url}
                        alt="Prévia do enquadramento da imagem do produto"
                        posicaoX={selecionado.imagem_posicao_x}
                        posicaoY={selecionado.imagem_posicao_y}
                        zoom={selecionado.imagem_zoom}
                      />
                    </div>
                    <div className="space-y-2">
                      <Input value={selecionado.imagem_url ?? ''} onChange={e => setSelecionado((s: any) => ({ ...s, imagem_url: e.target.value }))} />
                      <div className="grid gap-4 md:grid-cols-3">
                        <label className="text-xs font-semibold text-slate-600">
                          Posição horizontal: {limitarPercentual(selecionado.imagem_posicao_x)}%
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={limitarPercentual(selecionado.imagem_posicao_x)}
                            onChange={e => setSelecionado((s: any) => ({ ...s, imagem_posicao_x: Number(e.target.value) }))}
                            className="mt-2 w-full accent-emerald-600"
                          />
                        </label>
                        <label className="text-xs font-semibold text-slate-600">
                          Posição vertical: {limitarPercentual(selecionado.imagem_posicao_y)}%
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={limitarPercentual(selecionado.imagem_posicao_y)}
                            onChange={e => setSelecionado((s: any) => ({ ...s, imagem_posicao_y: Number(e.target.value) }))}
                            className="mt-2 w-full accent-emerald-600"
                          />
                        </label>
                        <label className="text-xs font-semibold text-slate-600">
                          Zoom: {limitarZoom(selecionado.imagem_zoom)}%
                          <input
                            type="range"
                            min="60"
                            max="180"
                            step="5"
                            value={limitarZoom(selecionado.imagem_zoom)}
                            onChange={e => setSelecionado((s: any) => ({ ...s, imagem_zoom: Number(e.target.value) }))}
                            className="mt-2 w-full accent-emerald-600"
                          />
                        </label>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="secondary" size="sm" onClick={() => setSelecionado((s: any) => ({ ...s, imagem_posicao_x: 50, imagem_posicao_y: 50, imagem_zoom: 100 }))}>
                          <RotateCcw className="h-4 w-4" /> Restaurar enquadramento
                        </Button>
                        <Button type="button" variant="ghost" size="sm" onClick={() => setSelecionado((s: any) => ({ ...s, imagem_url: '' }))}>Remover imagem</Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <ImageIcon className="h-4 w-4" />
                    Nenhuma imagem configurada.
                  </div>
                )}
                <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-100">
                  <Upload className="h-4 w-4" />
                  Enviar imagem
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) uploadImagem(file);
                    }}
                  />
                </label>
              </div>
            </Field>
            <Field label="Texto padrão para WhatsApp"><Textarea value={selecionado.whatsapp_texto ?? ''} onChange={e => setSelecionado((s: any) => ({ ...s, whatsapp_texto: e.target.value }))} placeholder="Ex.: Olá, tenho interesse no pacote..." /></Field>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 font-semibold text-slate-800">Cupom de desconto</div>
              <div className="grid gap-4 md:grid-cols-5">
                <Field label="Código"><Input value={selecionado.cupom_codigo ?? ''} onChange={e => setSelecionado((s: any) => ({ ...s, cupom_codigo: e.target.value.toUpperCase() }))} placeholder="EX.: MEDFIT10" /></Field>
                <Field label="Tipo">
                  <select className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm" value={selecionado.cupom_tipo ?? 'percentual'} onChange={e => setSelecionado((s: any) => ({ ...s, cupom_tipo: e.target.value }))}>
                    <option value="percentual">Percentual (%)</option>
                    <option value="valor">Valor fixo (R$)</option>
                  </select>
                </Field>
                <Field label="Valor"><Input type="number" min="0" step="0.01" value={selecionado.cupom_valor ?? ''} onChange={e => setSelecionado((s: any) => ({ ...s, cupom_valor: e.target.value }))} /></Field>
                <Field label="Validade"><Input type="date" value={selecionado.cupom_validade ?? ''} onChange={e => setSelecionado((s: any) => ({ ...s, cupom_validade: e.target.value }))} /></Field>
                <Field label="Limite de usos"><Input type="number" min="0" value={selecionado.cupom_limite_usos ?? ''} onChange={e => setSelecionado((s: any) => ({ ...s, cupom_limite_usos: e.target.value }))} /></Field>
              </div>
              <label className="mt-3 flex items-center gap-2 text-sm">
                <input type="checkbox" checked={!!selecionado.cupom_ativo} onChange={e => setSelecionado((s: any) => ({ ...s, cupom_ativo: e.target.checked }))} />
                Cupom ativo
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Resumo antes do pagamento">
                <Textarea
                  value={selecionado.checkout_resumo_texto ?? ''}
                  onChange={e => setSelecionado((s: any) => ({ ...s, checkout_resumo_texto: e.target.value }))}
                  placeholder="Ex.: Seu horário será reservado por 15 minutos enquanto o pagamento é concluído."
                />
              </Field>
              <Field label="Política de pagamento/cancelamento">
                <Textarea
                  value={selecionado.politica_pagamento ?? ''}
                  onChange={e => setSelecionado((s: any) => ({ ...s, politica_pagamento: e.target.value }))}
                  placeholder="Ex.: O sinal confirma a reserva. Remarcações devem ser solicitadas com antecedência."
                />
              </Field>
              <Field label="Mensagem após pagamento">
                <Textarea
                  value={selecionado.mensagem_pos_pagamento ?? ''}
                  onChange={e => setSelecionado((s: any) => ({ ...s, mensagem_pos_pagamento: e.target.value }))}
                  placeholder="Ex.: Pagamento recebido. Nossa equipe confirmará sua avaliação pelo WhatsApp."
                />
              </Field>
            </div>
            <div className="flex flex-wrap gap-5">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!selecionado.ativo} onChange={e => setSelecionado((s: any) => ({ ...s, ativo: e.target.checked }))} /> Ativo na vitrine</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!selecionado.destaque} onChange={e => setSelecionado((s: any) => ({ ...s, destaque: e.target.checked }))} /> Destacar</label>
            </div>
            <div className="flex justify-between">
              {selecionado.id ? <Button variant="danger" onClick={excluir}><Trash2 className="h-4 w-4" /> Excluir</Button> : <div />}
              <Button onClick={salvar} disabled={salvando || !selecionado.nome}><Save className="h-4 w-4" /> {salvando ? 'Salvando...' : 'Salvar produto'}</Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function linhas(value: string) {
  return String(value || '').split(/\r?\n/).map(item => item.trim()).filter(Boolean);
}

function calcularSinal(preco: string | number | null | undefined, percentual: string | number | null | undefined) {
  const valor = Number(preco);
  const pct = Number(percentual);
  if (!Number.isFinite(valor) || !Number.isFinite(pct)) return 0;
  return valor * pct / 100;
}

function moeda(valor: number | string) {
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function limitarPercentual(value: unknown) {
  const numero = Number(value);
  if (!Number.isFinite(numero)) return 50;
  return Math.min(100, Math.max(0, Math.round(numero)));
}

function limitarZoom(value: unknown) {
  const numero = Number(value);
  if (!Number.isFinite(numero)) return 100;
  return Math.min(180, Math.max(60, Math.round(numero)));
}

const DIAS_SEMANA = [
  { value: 1, label: 'Segunda' },
  { value: 2, label: 'Terça' },
  { value: 3, label: 'Quarta' },
  { value: 4, label: 'Quinta' },
  { value: 5, label: 'Sexta' },
  { value: 6, label: 'Sábado' },
  { value: 0, label: 'Domingo' },
];

function horariosTexto(agenda: unknown, dia: number) {
  if (!agenda || typeof agenda !== 'object' || Array.isArray(agenda)) return '';
  return String((agenda as Record<string, unknown>)[String(dia)] ?? '');
}

function atualizarTextoDia(agenda: unknown, dia: number, texto: string) {
  const atual = agenda && typeof agenda === 'object' && !Array.isArray(agenda)
    ? { ...(agenda as Record<string, string>) }
    : {};
  if (texto.trim()) {
    atual[String(dia)] = texto;
  } else {
    delete atual[String(dia)];
  }
  return atual;
}

function agendaParaTexto(agenda: unknown) {
  const normalizada = normalizarAgendaHorarios(agenda);
  return Object.entries(normalizada)
    .sort(([dataA], [dataB]) => dataA.localeCompare(dataB))
    .map(([data, horarios]) => `${formatarDataAgenda(data)}: ${horarios.join(', ')}`)
    .join('\n');
}

function textoParaAgenda(agendaTexto: unknown) {
  if (!agendaTexto) return {};
  const agenda: Record<string, string[]> = {};
  for (const linha of String(agendaTexto).split(/\r?\n/)) {
    const texto = linha.trim();
    if (!texto) continue;
    const match = texto.match(/^(\d{2}\/\d{2}\/\d{4}|\d{4}-\d{2}-\d{2})\s*:\s*(.+)$/);
    if (!match) continue;
    const data = normalizarDataAgenda(match[1]);
    const horarios = normalizarHorarios(match[2]);
    if (data && horarios.length) agenda[data] = horarios;
  }
  return agenda;
}

function normalizarAgendaHorarios(value: unknown): Record<string, string[]> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const agenda: Record<string, string[]> = {};
  for (const [dataOuDia, horarios] of Object.entries(value as Record<string, unknown>)) {
    const data = normalizarDataAgenda(dataOuDia);
    if (!data) continue;
    const lista = Array.isArray(horarios) ? horarios : String(horarios || '').split(',');
    const limpos = normalizarHorarios(lista.join(','));
    if (limpos.length) agenda[data] = limpos;
  }
  return agenda;
}

function normalizarHorarios(texto: string) {
  return [...new Set(String(texto || '')
    .split(',')
    .map(item => item.trim())
    .filter(item => /^([01]\d|2[0-3]):[0-5]\d$/.test(item))
    .sort())];
}

function diasDaAgenda(agenda: unknown) {
  return [...new Set(Object.keys(normalizarAgendaHorarios(agenda)).map(data => new Date(`${data}T12:00:00`).getDay()))];
}

function periodosDaAgenda(agenda: unknown) {
  const horarios = Object.values(normalizarAgendaHorarios(agenda)).flat();
  const periodos = new Set<string>();
  for (const horario of horarios) {
    const hora = Number(horario.slice(0, 2));
    if (hora < 12) periodos.add('manha');
    else if (hora < 18) periodos.add('tarde');
    else periodos.add('noite');
  }
  return [...periodos];
}

function normalizarDataAgenda(valor: string) {
  const texto = String(valor || '').trim();
  const iso = texto.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return dataValida(`${iso[1]}-${iso[2]}-${iso[3]}`);
  const br = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!br) return null;
  return dataValida(`${br[3]}-${br[2]}-${br[1]}`);
}

function dataValida(data: string) {
  const parsed = new Date(`${data}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10) === data ? data : null;
}

function formatarDataAgenda(data: string) {
  const [ano, mes, dia] = data.split('-');
  return `${dia}/${mes}/${ano}`;
}
