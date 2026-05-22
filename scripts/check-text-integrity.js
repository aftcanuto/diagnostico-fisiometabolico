const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const targets = ['src', 'scripts', 'supabase', 'HANDOFF.md', 'README.md'];
const allowedExtensions = new Set(['.ts', '.tsx', '.js', '.sql', '.md', '.json', '.css']);
const ignoredDirs = new Set(['node_modules', '.next', '.git', '.npm-cache']);

const chr = (...codes) => String.fromCharCode(...codes);

const suspiciousTokens = [
  chr(0x00f0), // emoji mojibake prefix
  chr(0xfffd), // replacement character
  chr(0x00e2, 0x20ac),
  chr(0x00e2, 0x201a),
  chr(0x00e2, 0x0161),
  chr(0x00e2, 0x008f),
  chr(0x00e2, 0x201d),
  chr(0x00c3, 0x00b7),
  chr(0x00c3, 0x00a3),
  chr(0x00c3, 0x00a7),
  chr(0x00c3, 0x00a9),
  chr(0x00c3, 0x00aa),
  chr(0x00c3, 0x00ad),
  chr(0x00c3, 0x00b3),
  chr(0x00c3, 0x00ba),
  chr(0x00c2, 0x00b0),
  chr(0x00c2, 0x00b7),
];

function listFiles(entry) {
  const abs = path.join(root, entry);
  if (!fs.existsSync(abs)) return [];

  const stat = fs.statSync(abs);
  if (stat.isFile()) return [abs];

  const files = [];
  for (const name of fs.readdirSync(abs)) {
    if (ignoredDirs.has(name)) continue;
    const full = path.join(abs, name);
    const childStat = fs.statSync(full);
    if (childStat.isDirectory()) files.push(...listFiles(path.relative(root, full)));
    else files.push(full);
  }
  return files;
}

function stripKnownAllowedBlocks(file, text) {
  const rel = path.relative(root, file).replace(/\\/g, '/');

  // The PDF template keeps a small sanitizer map with intentionally corrupted
  // legacy tokens so older saved reports can be cleaned during rendering.
  if (rel === 'src/lib/pdf/template.ts') {
    return text.replace(
      /function limparTextoHTML[\s\S]*?function zoneColor/,
      'function limparTextoHTML_ALLOWED_SANITIZER\nfunction zoneColor',
    );
  }

  // This repair migration intentionally contains legacy mojibake strings on
  // the left side of SQL replace() calls.
  if (rel === 'supabase/migrations/042_normalize_text_integrity.sql') {
    return '';
  }

  // Preview scripts include inline SVG data used only to render local examples.
  if (rel.startsWith('scripts/preview-')) {
    return '';
  }

  return text;
}

const findings = [];

for (const target of targets) {
  for (const file of listFiles(target)) {
    if (!allowedExtensions.has(path.extname(file))) continue;
    const rel = path.relative(root, file).replace(/\\/g, '/');
    const text = stripKnownAllowedBlocks(file, fs.readFileSync(file, 'utf8'));
    const lines = text.split(/\r?\n/);

    lines.forEach((line, index) => {
      const token = suspiciousTokens.find((item) => line.includes(item));
      if (token) {
        findings.push({
          file: rel,
          line: index + 1,
          token,
          text: line.trim().slice(0, 160),
        });
      }
    });
  }
}

if (findings.length) {
  console.error('Caracteres possivelmente corrompidos encontrados:');
  for (const finding of findings.slice(0, 80)) {
    console.error(`- ${finding.file}:${finding.line} (${JSON.stringify(finding.token)}) ${finding.text}`);
  }
  if (findings.length > 80) console.error(`...mais ${findings.length - 80} ocorrencias.`);
  process.exit(1);
}

console.log(JSON.stringify({ ok: true, checked: targets }, null, 2));
