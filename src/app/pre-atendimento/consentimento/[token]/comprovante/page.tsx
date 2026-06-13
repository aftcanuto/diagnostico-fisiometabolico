import { createHash } from 'crypto';
import { notFound } from 'next/navigation';
import { unstable_noStore as noStore } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/server';
import { PrintButton } from '@/components/PrintButton';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function dataHora(valor?: string | null) {
  if (!valor) return 'Registro indisponivel';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date(valor));
}

function hashEvidencia(texto: string, token: string, aceitoEm: string, pacienteId: string) {
  return createHash('sha256')
    .update(`${texto}|${token}|${aceitoEm}|${pacienteId}`)
    .digest('hex');
}

export default async function ConsentimentoComprovantePage(props: { params: Promise<{ token: string }> }) {
  const params = await props.params;
  noStore();
  const admin = createAdminClient();

  const { data: aceite } = await admin
    .from('consentimento_aceites')
    .select('*')
    .eq('token', params.token)
    .order('aceito_em', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!aceite) notFound();

  const [{ data: paciente }, { data: clinica }] = await Promise.all([
    admin.from('pacientes').select('nome, cpf').eq('id', aceite.paciente_id).maybeSingle(),
    admin.from('clinicas').select('nome, cnpj, telefone, email, site, endereco').eq('id', aceite.clinica_id).maybeSingle(),
  ]);
  const textoAceito = String(aceite.texto_aceito ?? '');
  const hash = aceite.texto_hash || hashEvidencia(textoAceito, params.token, aceite.aceito_em, aceite.paciente_id);
  const codigo = aceite.comprovante_codigo || `TCLE-${String(aceite.id).replace(/-/g, '').slice(0, 8).toUpperCase()}`;

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900 print:bg-white">
      <section className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-8 shadow-xl print:border-0 print:shadow-none">
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">Comprovante de aceite digital</div>
            <h1 className="mt-2 text-3xl font-bold text-slate-950">{aceite.modelo_nome ?? 'Termo/TCLE'}</h1>
            <p className="mt-2 text-sm text-slate-500">
              Documento gerado para consulta, auditoria e compartilhamento quando necessario.
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-right">
            <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Codigo</div>
            <div className="font-mono text-lg font-bold text-emerald-950">{codigo}</div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Info label="Paciente" valor={paciente?.nome ?? 'Nao informado'} />
          <Info label="CPF do paciente" valor={paciente?.cpf ?? 'Nao informado'} />
          <Info label="Clinica" valor={clinica?.nome ?? 'Nao informada'} />
          <Info label="Aceito em" valor={dataHora(aceite.aceito_em)} />
          <Info label="Versao do texto" valor={`v${aceite.texto_versao ?? 1}`} />
          <Info label="IP registrado" valor={aceite.ip ?? 'Nao registrado'} />
          <Info label="Token do link" valor={params.token} mono />
          <Info label="Dispositivo/navegador" valor={aceite.user_agent ?? 'Nao registrado'} />
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Hash de integridade do texto aceito</div>
          <div className="mt-2 break-all font-mono text-xs text-slate-800">{hash}</div>
        </div>

        {aceite.revogado && (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
            <div className="text-xs font-semibold uppercase tracking-wide text-amber-700">Revogacao registrada</div>
            <p className="mt-1 text-sm">
              Revogado em {dataHora(aceite.revogado_em)}. {aceite.motivo_revogacao ?? 'Sem motivo informado.'}
            </p>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3 print:hidden">
          <a
            href={`/pre-atendimento/consentimento/${params.token}`}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Ver termo original
          </a>
          <PrintButton>Imprimir / salvar PDF</PrintButton>
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-bold text-slate-950">Texto aceito</h2>
          <div className="mt-3 whitespace-pre-wrap rounded-2xl border border-slate-200 bg-white p-5 text-sm leading-7 text-slate-700">
            {textoAceito}
          </div>
        </div>
      </section>
    </main>
  );
}

function Info({ label, valor, mono = false }: { label: string; valor: string; mono?: boolean }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</div>
      <div className={`mt-1 break-words text-sm font-semibold text-slate-900 ${mono ? 'font-mono' : ''}`}>{valor}</div>
    </div>
  );
}
