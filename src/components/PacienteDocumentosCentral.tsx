'use client';

import { type ReactNode, useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  ClipboardCheck,
  Copy,
  ExternalLink,
  FileText,
  History,
  Link as LinkIcon,
  MailCheck,
  ShieldCheck,
} from 'lucide-react';

type AvaliacaoResumo = {
  id: string;
  data?: string | null;
  tipo?: string | null;
  status?: string | null;
  scores?: Array<{ global?: number | null }> | { global?: number | null } | null;
};

type PortalToken = {
  token: string;
  criado_em?: string | null;
  expira_em?: string | null;
};

type ConsentimentoLink = {
  id: string;
  token: string;
  created_at?: string | null;
  expira_em?: string | null;
  aceito_em?: string | null;
  consentimento_modelos?: { nome?: string | null; tipo?: string | null; versao?: number | null } | null;
};

type ConsentimentoAceite = {
  id: string;
  token?: string | null;
  aceito_em?: string | null;
  modelo_nome?: string | null;
  modelo_tipo?: string | null;
  texto_versao?: number | null;
  texto_hash?: string | null;
  comprovante_codigo?: string | null;
  revogado?: boolean | null;
};

type AnamneseLink = {
  id: string;
  token: string;
  created_at?: string | null;
  expira_em?: string | null;
  anamnese_templates?: { nome?: string | null } | null;
};

type AnamneseResposta = {
  id: string;
  enviado_em?: string | null;
  avaliacao_id?: string | null;
  anamnese_templates?: { nome?: string | null } | null;
};

type ProtocoloEnvio = {
  id: string;
  canal?: string | null;
  status?: string | null;
  destino?: string | null;
  enviado_em?: string | null;
};

type CentralState = {
  portalTokens: PortalToken[];
  consentimentoLinks: ConsentimentoLink[];
  consentimentoAceites: ConsentimentoAceite[];
  anamneseLinks: AnamneseLink[];
  anamneseRespostas: AnamneseResposta[];
  protocoloEnvios: ProtocoloEnvio[];
};

const vazio: CentralState = {
  portalTokens: [],
  consentimentoLinks: [],
  consentimentoAceites: [],
  anamneseLinks: [],
  anamneseRespostas: [],
  protocoloEnvios: [],
};

function dataCurta(valor?: string | null) {
  if (!valor) return 'Sem data';
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return 'Sem data';
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
  }).format(data);
}

function scoreGlobal(avaliacao: AvaliacaoResumo) {
  const scores = Array.isArray(avaliacao.scores) ? avaliacao.scores[0] : avaliacao.scores;
  return scores?.global ?? null;
}

async function buscarJson(url: string) {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}

export function PacienteDocumentosCentral({
  pacienteId,
  avaliacoes,
}: {
  pacienteId: string;
  avaliacoes: AvaliacaoResumo[];
}) {
  const [dados, setDados] = useState<CentralState>(vazio);
  const [copiado, setCopiado] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;
    async function carregar() {
      setCarregando(true);
      const query = `pacienteId=${encodeURIComponent(pacienteId)}`;
      const [portal, consentimentos, anamneses, protocolos] = await Promise.all([
        buscarJson(`/api/paciente-tokens?${query}`),
        buscarJson(`/api/consentimento-links?${query}`),
        buscarJson(`/api/anamnese-links?${query}`),
        buscarJson(`/api/protocolo-envios?${query}`),
      ]);

      if (!ativo) return;
      setDados({
        portalTokens: portal?.data ?? [],
        consentimentoLinks: consentimentos?.data ?? [],
        consentimentoAceites: consentimentos?.aceites ?? [],
        anamneseLinks: anamneses?.data ?? [],
        anamneseRespostas: anamneses?.respostas ?? [],
        protocoloEnvios: protocolos?.data ?? [],
      });
      setCarregando(false);
    }
    carregar();
    return () => {
      ativo = false;
    };
  }, [pacienteId]);

  const finalizadas = useMemo(
    () => avaliacoes.filter((a) => a.status === 'finalizada'),
    [avaliacoes],
  );
  const consentimentosAceitosPorLink = useMemo(
    () => dados.consentimentoLinks.filter((link) => link.aceito_em),
    [dados.consentimentoLinks],
  );
  const totalTermosAceitos =
    dados.consentimentoAceites.filter((a) => a.aceito_em && !a.revogado).length ||
    consentimentosAceitosPorLink.length;

  const origem = typeof window === 'undefined' ? '' : window.location.origin;
  const linksAtivos = dados.portalTokens.length + dados.anamneseLinks.length + dados.consentimentoLinks.length;

  async function copiar(texto: string, id: string) {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(id);
      window.setTimeout(() => setCopiado(null), 1800);
    } catch {
      setCopiado(null);
    }
  }

  return (
    <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 text-brand-700 text-xs font-semibold uppercase tracking-[0.16em]">
            <FileText className="w-4 h-4" />
            Central de documentos
          </div>
          <h2 className="mt-1 text-lg font-bold text-slate-900">Documentos e registros do paciente</h2>
          <p className="text-sm text-slate-500">
            Laudos, termos, anamneses, recomendações e links ativos reunidos em um só lugar.
          </p>
        </div>
        <div className="text-xs text-slate-400">
          {carregando ? 'Atualizando...' : 'Atualizado agora'}
        </div>
      </div>

      <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-5">
        <ResumoCard icone={<FileText />} rotulo="Laudos" valor={finalizadas.length} />
        <ResumoCard icone={<ShieldCheck />} rotulo="Termos aceitos" valor={totalTermosAceitos} />
        <ResumoCard icone={<ClipboardCheck />} rotulo="Anamneses" valor={dados.anamneseRespostas.length} />
        <ResumoCard icone={<MailCheck />} rotulo="Recomendações" valor={dados.protocoloEnvios.length} />
        <ResumoCard icone={<LinkIcon />} rotulo="Links ativos" valor={linksAtivos} />
      </div>

      <div className="grid gap-4 p-5 pt-0 lg:grid-cols-2">
        <Bloco titulo="Laudos e avaliações" icone={<FileText />}>
          {finalizadas.length ? finalizadas.slice(0, 4).map((avaliacao) => (
            <Linha
              key={avaliacao.id}
              titulo={`${dataCurta(avaliacao.data)} · ${avaliacao.tipo ?? 'Avaliação'}`}
              descricao={`Score global: ${scoreGlobal(avaliacao) ?? '—'}`}
              status="Finalizada"
              acao={(
                <a
                  href={`/api/pdf?avaliacaoId=${avaliacao.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline"
                >
                  PDF <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            />
          )) : <Vazio texto="Nenhum laudo finalizado ainda." />}
        </Bloco>

        <Bloco titulo="Termos e TCLE" icone={<ShieldCheck />}>
          {dados.consentimentoAceites.length ? dados.consentimentoAceites.slice(0, 4).map((aceite) => {
            const url = aceite.token ? `${origem}/pre-atendimento/consentimento/${aceite.token}/comprovante` : '';
            return (
              <Linha
                key={aceite.id}
                titulo={aceite.modelo_nome ?? 'Termo aceito'}
                descricao={`Aceito em ${dataCurta(aceite.aceito_em)}${aceite.texto_versao ? ` · v${aceite.texto_versao}` : ''}${aceite.comprovante_codigo ? ` · ${aceite.comprovante_codigo}` : ''}`}
                status={aceite.revogado ? 'Revogado' : 'Aceito'}
                acao={url ? (
                  <button
                    type="button"
                    onClick={() => copiar(url, aceite.id)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline"
                  >
                    {copiado === aceite.id ? 'Copiado' : 'Comprovante'} <Copy className="w-3.5 h-3.5" />
                  </button>
                ) : null}
              />
            );
          }) : consentimentosAceitosPorLink.length ? consentimentosAceitosPorLink.slice(0, 4).map((link) => {
            const modelo = Array.isArray(link.consentimento_modelos)
              ? link.consentimento_modelos[0]
              : link.consentimento_modelos;
            const url = `${origem}/pre-atendimento/consentimento/${link.token}/comprovante`;
            return (
              <Linha
                key={link.id}
                titulo={modelo?.nome ?? 'Termo aceito'}
                descricao={`Aceito em ${dataCurta(link.aceito_em)}${modelo?.versao ? ` · v${modelo.versao}` : ''}`}
                status="Aceito"
                acao={(
                  <button
                    type="button"
                    onClick={() => copiar(url, link.id)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline"
                  >
                    {copiado === link.id ? 'Copiado' : 'Comprovante'} <Copy className="w-3.5 h-3.5" />
                  </button>
                )}
              />
            );
          }) : <Vazio texto="Nenhum termo aceito registrado." />}
        </Bloco>

        <Bloco titulo="Anamneses pré-atendimento" icone={<ClipboardCheck />}>
          {dados.anamneseRespostas.length ? dados.anamneseRespostas.slice(0, 4).map((resposta) => (
            <Linha
              key={resposta.id}
              titulo={resposta.anamnese_templates?.nome ?? 'Anamnese respondida'}
              descricao={`Respondida em ${dataCurta(resposta.enviado_em)}`}
              status={resposta.avaliacao_id ? 'Vinculada' : 'Paciente'}
            />
          )) : dados.anamneseLinks.length ? dados.anamneseLinks.slice(0, 3).map((link) => {
            const url = `${origem}/pre-atendimento/anamnese/${link.token}`;
            return (
              <Linha
                key={link.id}
                titulo={link.anamnese_templates?.nome ?? 'Anamnese enviada'}
                descricao={`Expira em ${dataCurta(link.expira_em)}`}
                status="Pendente"
                acao={(
                  <button
                    type="button"
                    onClick={() => copiar(url, link.id)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline"
                  >
                    {copiado === link.id ? 'Copiado' : 'Copiar'} <Copy className="w-3.5 h-3.5" />
                  </button>
                )}
              />
            );
          }) : <Vazio texto="Nenhuma anamnese enviada ou respondida." />}
        </Bloco>

        <Bloco titulo="Recomendações e links ativos" icone={<History />}>
          {dados.protocoloEnvios.length ? dados.protocoloEnvios.slice(0, 4).map((envio) => (
            <Linha
              key={envio.id}
              titulo={`Recomendações pré-teste · ${envio.canal ?? 'manual'}`}
              descricao={`${dataCurta(envio.enviado_em)}${envio.destino ? ` · ${envio.destino}` : ''}`}
              status={envio.status ?? 'registrado'}
            />
          )) : dados.portalTokens.length ? dados.portalTokens.slice(0, 3).map((token) => {
            const url = `${origem}/p/${token.token}`;
            return (
              <Linha
                key={token.token}
                titulo="Portal do paciente"
                descricao={`Expira em ${dataCurta(token.expira_em)}`}
                status="Ativo"
                acao={(
                  <button
                    type="button"
                    onClick={() => copiar(url, token.token)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline"
                  >
                    {copiado === token.token ? 'Copiado' : 'Copiar'} <Copy className="w-3.5 h-3.5" />
                  </button>
                )}
              />
            );
          }) : <Vazio texto="Nenhuma recomendação ou link ativo." />}
        </Bloco>
      </div>
    </section>
  );
}

function ResumoCard({ icone, rotulo, valor }: { icone: ReactNode; rotulo: string; valor: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-brand-600 [&>svg]:h-4 [&>svg]:w-4">{icone}</div>
        <span className="text-2xl font-bold text-slate-900">{valor}</span>
      </div>
      <div className="mt-2 text-xs font-medium text-slate-500">{rotulo}</div>
    </div>
  );
}

function Bloco({ titulo, icone, children }: { titulo: string; icone: ReactNode; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3 text-sm font-bold text-slate-900">
        <span className="text-brand-600 [&>svg]:h-4 [&>svg]:w-4">{icone}</span>
        {titulo}
      </div>
      <div className="divide-y divide-slate-100">{children}</div>
    </div>
  );
}

function Linha({
  titulo,
  descricao,
  status,
  acao,
}: {
  titulo: string;
  descricao: string;
  status: string;
  acao?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-500" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-slate-800">{titulo}</div>
        <div className="truncate text-xs text-slate-500">{descricao}</div>
      </div>
      <span className="hidden rounded-full border border-emerald-100 bg-emerald-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 sm:inline-flex">
        {status}
      </span>
      {acao}
    </div>
  );
}

function Vazio({ texto }: { texto: string }) {
  return <div className="px-4 py-5 text-sm text-slate-400">{texto}</div>;
}
