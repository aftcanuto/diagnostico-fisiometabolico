import type { CSSProperties, ReactNode } from 'react';

type PublicClinica = {
  nome?: string | null;
  logo_url?: string | null;
};

export function PublicDocumentLayout({
  clinica,
  titulo,
  subtitulo,
  children,
  fontFamily,
}: {
  clinica?: PublicClinica | null;
  titulo: string;
  subtitulo?: string | null;
  children: ReactNode;
  fontFamily?: string;
}) {
  return (
    <main className="min-h-screen bg-[#F0EAE0] px-4 py-8 text-[#0C0C0C]" style={{ fontFamily }}>
      <div className="mx-auto max-w-3xl">
        <header className="relative overflow-hidden rounded-[2rem] border border-[#E5DDD2] bg-[#FAF5EF] p-7 shadow-[0_22px_50px_rgba(21,92,71,0.09)]">
          <div className="pointer-events-none absolute -right-20 -top-28 h-80 w-80 rounded-full bg-[#1D9E75]/15 blur-2xl" />
          <div className="relative flex items-center gap-4">
            {clinica?.logo_url && (
              <img src={clinica.logo_url} alt="" className="h-16 w-16 rounded-2xl border border-[#E5DDD2] bg-white object-contain p-1 shadow-sm" />
            )}
            <div>
              <div className="inline-flex rounded-full bg-[#E8F7F1] px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#155C47]">
                {clinica?.nome ?? 'Diagnóstico Fisiometabólico'}
              </div>
              <h1 className="mt-3 font-serif text-4xl font-semibold leading-[0.98] tracking-[-0.045em] text-[#0C0C0C]">
                {titulo}
              </h1>
              {subtitulo && <p className="mt-3 text-sm leading-6 text-[#5A5A5A]">{subtitulo}</p>}
            </div>
          </div>
        </header>
        {children}
      </div>
    </main>
  );
}

export function PublicDocumentCard({
  children,
  className = '',
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <section
      className={`mt-5 rounded-[1.75rem] border border-[#E5DDD2] bg-[#FFFAF5] p-6 shadow-[0_18px_44px_rgba(12,12,12,0.055)] ${className}`}
      style={style}
    >
      {children}
    </section>
  );
}

export const publicRichTextStyles = `.rich-text{color:#5A5A5A}.rich-text h1{font-family:Georgia,serif;font-size:1.8em;font-weight:600;line-height:1.12;margin:.75em 0 .45em;color:#0C0C0C;letter-spacing:-.03em}.rich-text h2{font-family:Georgia,serif;font-size:1.45em;font-weight:600;line-height:1.18;margin:.7em 0 .4em;color:#0C0C0C;letter-spacing:-.025em}.rich-text h3{font-size:.88em;font-weight:800;letter-spacing:.08em;text-transform:uppercase;margin:1.4em 0 .55em;color:#27384d}.rich-text p,.rich-text div{margin:.55em 0}.rich-text ul,.rich-text ol{padding-left:1.5em;margin:.75em 0}.rich-text ul{list-style:disc}.rich-text ol{list-style:decimal}.rich-text li{margin:.35em 0}.rich-text hr{border:0;border-top:1px solid #E5DDD2;margin:1.1em 0}`;
