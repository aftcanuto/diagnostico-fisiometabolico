'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Input';
import { Card, CardBody } from '@/components/ui/Card';
import { Activity } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nome, setNome] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setLoading(true);
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email, password, options: { data: { nome } }
        });
        if (error) throw error;
      }
      router.push('/dashboard');
      router.refresh();
    } catch (e: any) {
      setErr(e.message ?? 'Erro');
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen grid place-items-center p-4 bg-gradient-to-br from-brand-50 via-white to-slate-100">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 justify-center mb-6">
          <div className="w-11 h-11 rounded-xl bg-brand-600 text-white grid place-items-center">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800">Diagnóstico Fisiometabólico</h1>
            <p className="text-xs text-slate-500">Avaliação clínica inteligente</p>
          </div>
        </div>
        <Card>
          <CardBody>
            <div className="flex gap-2 mb-5 p-1 bg-slate-100 rounded-lg">
              <button
                onClick={() => setMode('signin')}
                className={`flex-1 h-9 rounded-md text-sm font-medium ${mode === 'signin' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}
              >Entrar</button>
              <button
                onClick={() => setMode('signup')}
                className={`flex-1 h-9 rounded-md text-sm font-medium ${mode === 'signup' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}
              >Criar conta</button>
            </div>
            <form onSubmit={submit} className="space-y-4">
              {mode === 'signup' && (
                <Field label="Nome do avaliador">
                  <Input value={nome} onChange={e => setNome(e.target.value)} required />
                </Field>
              )}
              <Field label="E-mail">
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
              </Field>
              <Field label="Senha">
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
              </Field>
              {err && <p className="text-sm text-red-600">{err}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Aguarde…' : mode === 'signin' ? 'Entrar' : 'Criar conta'}
              </Button>
            </form>
          </CardBody>
        </Card>
        <p className="text-center text-xs text-slate-500 mt-4">
          © {new Date().getFullYear()} — Sistema modular de avaliação
        </p>
      </div>
    </div>
  );
}
