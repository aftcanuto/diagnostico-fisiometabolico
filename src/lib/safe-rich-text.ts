const ALLOWED_TAGS = new Set([
  'b', 'br', 'div', 'em', 'font', 'h1', 'h2', 'h3', 'hr', 'i', 'li',
  'ol', 'p', 'span', 'strong', 'u', 'ul',
]);

export function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function plainTextToHtml(value: string) {
  return value
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replaceAll('\n', '<br>')}</p>`)
    .join('');
}

export function sanitizeRichTextHtml(value: string | null | undefined) {
  if (!value) return '';

  return value.replace(/<\/?([a-z0-9]+)([^>]*)>/gi, (match, rawTag, rawAttributes) => {
    const tag = String(rawTag).toLowerCase();
    const attributes = String(rawAttributes);
    if (!ALLOWED_TAGS.has(tag)) return '';
    if (match.startsWith('</')) return `</${tag}>`;
    if (tag === 'br' || tag === 'hr') return `<${tag}>`;

    if (tag === 'font') {
      const size = attributes.match(/\bsize\s*=\s*["']?([1-7])["']?/i)?.[1];
      const align = alignmentStyle(attributes);
      return `<font${size ? ` size="${size}"` : ''}${align}>`;
    }

    return `<${tag}${alignmentStyle(attributes)}>`;
  });
}

function alignmentStyle(attributes: string) {
  const styleAlign = attributes.match(/\btext-align\s*:\s*(left|center|right|justify)\b/i)?.[1];
  const attrAlign = attributes.match(/\balign\s*=\s*["']?(left|center|right|justify)["']?/i)?.[1];
  const align = styleAlign || attrAlign;
  return align ? ` style="text-align:${align.toLowerCase()}"` : '';
}

export function getRichTextHtml(html: string | null | undefined, text: string | null | undefined) {
  return sanitizeRichTextHtml(html) || plainTextToHtml(text || '');
}
