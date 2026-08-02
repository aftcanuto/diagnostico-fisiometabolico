type ClinicaFooter = {
  nome?: string | null;
  endereco?: string | null;
  telefone?: string | null;
  email?: string | null;
  site?: string | null;
  instagram?: string | null;
};

export function PublicDocumentFooter({ clinica, extra }: { clinica?: ClinicaFooter | null; extra?: string }) {
  const itens = [
    clinica?.endereco,
    clinica?.telefone && `Tel.: ${clinica.telefone}`,
    clinica?.email,
    clinica?.site,
  ].filter(Boolean);

  if (!clinica?.nome && itens.length === 0 && !extra) return null;

  return (
    <footer className="mt-6 rounded-[1.75rem] border border-[#E5DDD2] bg-[#FAF5EF] px-6 py-5 text-center text-xs leading-5 text-[#5A5A5A] shadow-[0_16px_36px_rgba(12,12,12,0.045)]">
      {clinica?.nome && <div className="font-semibold text-[#0C0C0C]">{clinica.nome}</div>}
      {itens.length > 0 && <div className="mt-1">{itens.join(' · ')}</div>}
      {extra && <div className="mt-1 text-[#5A5A5A]/70">{extra}</div>}
    </footer>
  );
}
