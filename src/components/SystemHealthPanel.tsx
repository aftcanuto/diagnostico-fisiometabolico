'use client';

import { type ReactNode, useEffect, useState } from 'react';
import { Activity, AlertTriangle, CheckCircle2, Database, FileText, HardDrive, RefreshCw, ServerCog, Sparkles } from 'lucide-react';

type HealthResponse = {
  ok: boolean;
  generatedAt: string;
  checks: Record<string, boolean>;
  banco: { ok: boolean; tabelas: Array<{ table: string; ok: boolean; count: number | null; error: string | null }> };
  storage: { ok: boolean; buckets: Array<{ bucket: string; ok: boolean }>; error: string | null };
  ia: { ok: boolean; model: string | null };
  pdf: { ok: boolean; message: string };
  env: Array<{ name: string; ok: boolean }>;
  migrations: {
    ok: boolean;
    ultimaEsperada: string;
    ultimaAplicada: string | null;
    aplicadas: number;
    esperadas: number;
    faltantes: string[];
    error: string | null;
  };
};

function statusLabel(ok?: boolean) {
  return ok ? 'OK' : 'Atencao';
}

function statusClass(ok?: boolean) {
  return ok
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
    : 'border-amber-200 bg-amber-50 text-amber-700';
}

export function SystemHealthPanel() {
  const [data, setData] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/health', { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Falha ao consultar saude do sistema');
      setData(json);
    } catch (err: any) {
      setError(err?.message || 'Falha ao consultar saude do sistema');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="border-b border-slate-100 p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">
            <ServerCog className="h-4 w-4" />
            Saude do sistema
          </div>
          <h2 className="mt-1 text-lg font-bold text-slate-900">Painel administrativo operacional</h2>
          <p className="text-sm text-slate-500">
            Banco, storage, IA, PDF, variaveis de ambiente e migrations aplicadas.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      {error && (
        <div className="m-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && !data ? (
        <div className="p-5 text-sm text-slate-500">Verificando componentes...</div>
      ) : data ? (
        <div className="space-y-5 p-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <HealthCard icon={<Database />} title="Banco" ok={data.checks.banco} detail={`${data.banco.tabelas.filter((t) => t.ok).length}/${data.banco.tabelas.length} tabelas`} />
            <HealthCard icon={<HardDrive />} title="Storage" ok={data.checks.storage} detail={`${data.storage.buckets.filter((b) => b.ok).length}/${data.storage.buckets.length} buckets`} />
            <HealthCard icon={<Sparkles />} title="IA" ok={data.checks.ia} detail={data.ia.model || 'modelo ausente'} />
            <HealthCard icon={<FileText />} title="PDF" ok={data.checks.pdf} detail={data.pdf.message} />
            <HealthCard icon={<Activity />} title="Env vars" ok={data.checks.env} detail={`${data.env.filter((env) => env.ok).length}/${data.env.length} presentes`} />
            <HealthCard icon={<ServerCog />} title="Migrations" ok={data.checks.migrations} detail={`${data.migrations.aplicadas}/${data.migrations.esperadas}`} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <DetailBlock title="Variaveis de ambiente">
              {data.env.map((env) => (
                <StatusLine key={env.name} label={env.name} ok={env.ok} detail={env.ok ? 'Configurada' : 'Ausente'} />
              ))}
            </DetailBlock>

            <DetailBlock title="Migrations">
              <StatusLine label="Ultima esperada" ok detail={data.migrations.ultimaEsperada} />
              <StatusLine label="Ultima aplicada" ok={data.migrations.ok} detail={data.migrations.ultimaAplicada || data.migrations.error || 'Tabela de controle ausente'} />
              {data.migrations.faltantes.length ? (
                <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                  <div className="font-bold">Migrations pendentes em producao</div>
                  <div className="mt-1 max-h-32 overflow-auto font-mono leading-relaxed">
                    {data.migrations.faltantes.join('\n')}
                  </div>
                </div>
              ) : null}
            </DetailBlock>
          </div>

          <DetailBlock title="Banco e storage">
            <div className="grid gap-2 lg:grid-cols-2">
              {data.banco.tabelas.map((table) => (
                <StatusLine key={table.table} label={table.table} ok={table.ok} detail={table.ok ? `${table.count ?? 0} registros` : table.error || 'erro'} />
              ))}
              {data.storage.buckets.map((bucket) => (
                <StatusLine key={bucket.bucket} label={`bucket ${bucket.bucket}`} ok={bucket.ok} detail={bucket.ok ? 'Encontrado' : 'Ausente'} />
              ))}
            </div>
          </DetailBlock>
        </div>
      ) : null}
    </section>
  );
}

function HealthCard({ icon, title, ok, detail }: { icon: ReactNode; title: string; ok?: boolean; detail: string }) {
  return (
    <div className={`rounded-xl border p-4 ${statusClass(ok)}`}>
      <div className="flex items-center justify-between gap-3">
        <span className="[&>svg]:h-4 [&>svg]:w-4">{icon}</span>
        {ok ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
      </div>
      <div className="mt-3 text-sm font-bold">{title}</div>
      <div className="mt-1 truncate text-xs opacity-80">{detail}</div>
    </div>
  );
}

function DetailBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
      <h3 className="text-sm font-bold text-slate-900">{title}</h3>
      <div className="mt-3 space-y-2">{children}</div>
    </div>
  );
}

function StatusLine({ label, ok, detail }: { label: string; ok?: boolean; detail: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs">
      <div className="min-w-0">
        <div className="truncate font-semibold text-slate-700">{label}</div>
        <div className="truncate text-slate-400">{detail}</div>
      </div>
      <span className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${statusClass(ok)}`}>
        {statusLabel(ok)}
      </span>
    </div>
  );
}
