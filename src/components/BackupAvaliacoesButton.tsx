'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function BackupAvaliacoesButton({ podeExportar }: { podeExportar: boolean }) {
  const [baixando, setBaixando] = useState(false);

  async function baixarBackup() {
    setBaixando(true);
    try {
      const res = await fetch('/api/backup/avaliacoes', { method: 'GET' });
      if (!res.ok) {
        const erro = await res.json().catch(() => null);
        throw new Error(erro?.error ?? 'Nao foi possivel gerar o backup.');
      }

      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = href;
      link.download = res.headers.get('x-backup-filename') ?? 'backup-avaliacoes.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(href);
    } catch (error: any) {
      alert(error?.message ?? 'Falha ao baixar o backup.');
    } finally {
      setBaixando(false);
    }
  }

  if (!podeExportar) return null;

  return (
    <Button variant="secondary" onClick={baixarBackup} disabled={baixando}>
      <Download className="w-4 h-4" />
      {baixando ? 'Gerando planilha...' : 'Baixar backup em planilha'}
    </Button>
  );
}
