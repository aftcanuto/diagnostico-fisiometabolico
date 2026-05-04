'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Activity, LayoutDashboard, Users, LogOut, Package, Building2, Settings, ClipboardList } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/cn';

export function AppShell({
  user, clinica, children,
}: {
  user: { nome: string; email: string };
  clinica?: { nome: string; logo_url?: string | null } | null;
  children: React.ReactNode;
}) {
  const path = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const nav = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/pacientes', label: 'Pacientes', icon: Users },
    { href: '/avaliacoes', label: 'Avaliações', icon: ClipboardList },
    { href: '/produtos', label: 'Produtos', icon: Package },
    { href: '/clinica', label: 'Clínica', icon: Building2 },
    { href: '/configuracoes', label: 'Configurações', icon: Settings },
  ];

  async function logout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-14">
          <Link href="/dashboard" className="flex items-center gap-2">
            {clinica?.logo_url ? (
              <img src={clinica.logo_url} alt="logo" className="w-8 h-8 rounded-lg object-contain bg-white border border-slate-100" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-brand-600 text-white grid place-items-center">
                <Activity className="w-4 h-4" />
              </div>
            )}
            <span className="font-semibold text-slate-800 text-sm hidden sm:block">
              {clinica?.nome ?? 'Diagnóstico Fisiometabólico'}
            </span>
          </Link>
          <nav className="flex items-center gap-1">
            {nav.map(n => {
              const Icon = n.icon;
              const active = path === n.href || path?.startsWith(n.href + '/');
              return (
                <Link key={n.href} href={n.href}
                  className={cn(
                    'flex items-center gap-2 px-3 h-9 rounded-lg text-sm',
                    active ? 'bg-brand-50 text-brand-700 font-medium' : 'text-slate-600 hover:bg-slate-50'
                  )}>
                  <Icon className="w-4 h-4" /><span className="hidden md:inline">{n.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-3">
            <div className="text-right leading-tight hidden sm:block">
              <div className="text-sm text-slate-800 font-medium">{user.nome}</div>
              <div className="text-xs text-slate-500">{user.email}</div>
            </div>
            <button onClick={logout} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100" title="Sair">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-6">{children}</main>
    </div>
  );
}
