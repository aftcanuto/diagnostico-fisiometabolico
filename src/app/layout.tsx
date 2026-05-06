import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Diagnostico Fisiometabolico',
  description: 'Avaliacao fisiometabolica completa',
  applicationName: 'Diagnostico Fisiometabolico',
  manifest: '/site.webmanifest',
  icons: {
    icon: [{ url: '/favicon.png', type: 'image/png' }],
    shortcut: ['/favicon.png'],
    apple: [{ url: '/apple-touch-icon.png', type: 'image/png' }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
