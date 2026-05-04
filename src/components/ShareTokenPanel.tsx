'use client';
import { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Copy, Link2, Check, X, ChevronDown, ChevronUp } from 'lucide-react';

export function ShareTokenPanel({ pacienteId }: { pacienteId: string }) {
  const [tokens, setTokens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);
  const [copiado, setCopiado] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/paciente-tokens?pacienteId=${encodeURIComponent(pacienteId)}`, { cache: 'no-store' })
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (!res.ok) setErro(body.error ?? 'Erro ao carregar links');
        setTokens(body.data ?? []);
      })
      .catch(() => setErro('Erro ao carregar links'))
      .finally(() => setLoading(false));
  }, [pacienteId]);

  async function gerar() {
    setErro(null);
    setLoading(true);
    const res = await fetch('/api/paciente-tokens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pacienteId }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) setErro(body.error ?? 'Erro ao gerar link');
    if (res.ok && body.data) setTokens(t => [body.data, ...t]);
    setLoading(false);
    setExpanded(true);
  }

  async function revogar(token: string) {
    if (!confirm('Revogar este link? O paciente nao conseguira mais acessar.')) return;
    setErro(null);
    const res = await fetch('/api/paciente-tokens', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErro(body.error ?? 'Erro ao revogar link');
      return;
    }
    setTokens(t => t.map(x => x.token === token ? { ...x, revogado: true } : x));
  }

  async function copiar(token: string) {
    const url = `${window.location.origin}/p/${token}`;
    await navigator.clipboard.writeText(url);
    setCopiado(token);
    setTimeout(() => setCopiado(null), 2000);
  }

  const ativos = tokens.filter(t => !t.revogado && new Date(t.expira_em) > new Date());

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            <Link2 className="inline w-4 h-4 mr-1" />
            Link do portal do paciente
            {ativos.length > 0 && (
              <span className="ml-2 text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
                {ativos.length} ativo{ativos.length > 1 ? 's' : ''}
              </span>
            )}
          </CardTitle>
          <button onClick={() => setExpanded(x => !x)} className="text-slate-500 hover:text-slate-800">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </CardHeader>
      {expanded && (
        <CardBody>
          <p className="text-sm text-slate-500 mb-3">
            Gere um link seguro para o paciente acessar o proprio dashboard.
            Expira em 90 dias. Voce pode revogar a qualquer momento.
          </p>
          {erro && (
            <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              Nao foi possivel gerar o link: {erro}
            </div>
          )}
          <Button onClick={gerar} disabled={loading}>
            <Link2 className="w-4 h-4" /> {loading ? 'Carregando...' : 'Gerar novo link'}
          </Button>

          {tokens.length > 0 && (
            <div className="mt-4 space-y-2">
              {tokens.map(t => {
                const vencido = new Date(t.expira_em) <= new Date();
                const inativo = t.revogado || vencido;
                const url = typeof window !== 'undefined' ? `${window.location.origin}/p/${t.token}` : '';
                return (
                  <div key={t.token} className={`rounded-lg border p-3 flex flex-col md:flex-row md:items-center gap-2 ${inativo ? 'bg-slate-50 opacity-70' : 'bg-white'}`}>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-slate-500">
                        Criado em {new Date(t.criado_em).toLocaleDateString('pt-BR')} · Expira em {new Date(t.expira_em).toLocaleDateString('pt-BR')}
                        {t.revogado && <span className="ml-2 text-red-600 font-medium">REVOGADO</span>}
                        {vencido && !t.revogado && <span className="ml-2 text-amber-600 font-medium">VENCIDO</span>}
                      </div>
                      <div className="font-mono text-xs text-slate-600 truncate">{url}</div>
                    </div>
                    {!inativo && (
                      <div className="flex gap-1">
                        <Button size="sm" variant="secondary" onClick={() => copiar(t.token)}>
                          {copiado === t.token ? <><Check className="w-3 h-3" /> Copiado</> : <><Copy className="w-3 h-3" /> Copiar</>}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => revogar(t.token)} title="Revogar">
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardBody>
      )}
    </Card>
  );
}
