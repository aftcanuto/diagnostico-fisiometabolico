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
    <main
      className="min-h-screen overflow-x-clip bg-[#F0EAE0] px-3 py-6 text-[#0C0C0C] sm:px-4 sm:py-8"
      style={{ fontFamily }}
    >
      <div className="mx-auto w-full min-w-0 max-w-3xl">
        <header className="relative isolate overflow-hidden rounded-[2rem] border border-[#E5DDD2] bg-[#FAF5EF] p-[1.125rem] shadow-[0_14px_32px_rgba(12,12,12,0.07)] sm:p-7">
          <div className="relative grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-4 sm:flex sm:items-center sm:gap-4">
            {clinica?.logo_url && (
              <img
                src={clinica.logo_url}
                alt=""
                className="h-12 w-12 shrink-0 rounded-xl border border-[#E5DDD2] bg-white object-contain p-1 shadow-sm sm:h-16 sm:w-16 sm:rounded-2xl"
              />
            )}
            <div className="contents sm:block sm:min-w-0 sm:flex-1">
              <div className="inline-flex max-w-full justify-self-start break-words rounded-full bg-[#E8F7F1] px-3 py-2 text-[0.68rem] font-bold uppercase leading-4 tracking-normal text-[#155C47] [overflow-wrap:anywhere] sm:px-4 sm:text-xs">
                {clinica?.nome ?? 'Diagnóstico Fisiometabólico'}
              </div>
              <div className="col-span-2 min-w-0 sm:mt-3">
                <h1 className="max-w-full break-words font-serif text-[1.625rem] font-semibold leading-[1.02] tracking-normal text-[#0C0C0C] sm:text-4xl">
                  {titulo}
                </h1>
                {subtitulo && (
                  <p className="mt-2 max-w-full break-words text-sm leading-6 text-[#5A5A5A] [overflow-wrap:anywhere] sm:mt-3">
                    {subtitulo}
                  </p>
                )}
              </div>
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
