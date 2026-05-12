export function valorCsv(valor: unknown) {
  if (valor == null) return '';
  const texto = typeof valor === 'string' ? valor : JSON.stringify(valor);
  const seguro = /^[=+\-@]/.test(texto) ? `'${texto}` : texto;
  return `"${seguro.replace(/"/g, '""')}"`;
}

export function montarCsv(headers: string[], linhas: Record<string, unknown>[]) {
  const cabecalho = headers.map(valorCsv).join(';');
  const corpo = linhas.map((linha) => headers.map((header) => valorCsv(linha[header])).join(';')).join('\n');
  return `\uFEFF${cabecalho}\n${corpo}`;
}

