'use client';

import { useState } from 'react';
import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

type Props = {
  href: string;
  label?: string;
  title?: string;
  text?: string;
};

function absoluteUrl(href: string) {
  if (href.startsWith('http')) return href;
  if (typeof window === 'undefined') return href;
  return `${window.location.origin}${href}`;
}

export function ProductCatalogShareButton({
  href,
  label = 'Compartilhar vitrine',
  title = 'Produtos e servicos',
  text = 'Conheca nossos produtos e servicos.',
}: Props) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = absoluteUrl(href);
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2200);
      }
    } catch {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2200);
      } catch {}
    }
  }

  return (
    <Button type="button" variant="secondary" onClick={share}>
      <Share2 className="h-4 w-4" />
      {copied ? 'Link copiado' : label}
    </Button>
  );
}
