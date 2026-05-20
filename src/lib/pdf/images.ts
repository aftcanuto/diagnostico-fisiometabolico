function bufferToDataUrl(bytes: ArrayBuffer, mimeType: string) {
  return `data:${mimeType || 'image/png'};base64,${Buffer.from(bytes).toString('base64')}`;
}

function supabaseProjectUrl() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  return raw.replace(/\/rest\/v1\/?$/i, '').replace(/\/$/, '');
}

function parseSupabaseStorageUrl(raw: string) {
  try {
    const base = supabaseProjectUrl() || 'https://example.supabase.co';
    const url = new URL(raw, base);
    const match = url.pathname.match(/\/storage\/v1\/(?:object\/(?:public|sign)|render\/image\/public)\/([^/]+)\/(.+)$/);
    if (!match) return null;
    return {
      bucket: decodeURIComponent(match[1]),
      path: decodeURIComponent(match[2]),
    };
  } catch {
    return null;
  }
}

function driveImageCandidates(raw: string) {
  const driveMatch = raw.match(/drive\.google\.com\/file\/d\/([^/]+)/) || raw.match(/[?&]id=([^&]+)/);
  const id = driveMatch?.[1];
  if (!id) return [];
  return [
    `https://drive.google.com/uc?export=download&id=${id}`,
    `https://drive.google.com/uc?export=view&id=${id}`,
    `https://drive.google.com/thumbnail?id=${id}&sz=w2000`,
  ];
}

function supabaseUrlCandidates(raw: string) {
  const value = raw.trim();
  const projectUrl = supabaseProjectUrl();
  if (!projectUrl || !value) return [];

  if (value.startsWith('/storage/v1/')) return [`${projectUrl}${value}`];
  if (!/^https?:\/\//i.test(value) && !value.startsWith('data:image/')) {
    const clean = value.replace(/^\/+/, '').replace(/^biomecanica\//, '');
    return [`${projectUrl}/storage/v1/object/public/biomecanica/${clean}`];
  }

  return [];
}

async function tryDownloadFromStorage(raw: string, admin: any): Promise<string | null> {
  const value = raw.trim();
  const parsed = parseSupabaseStorageUrl(value);
  const attempts: Array<{ bucket: string; path: string }> = [];

  if (parsed?.bucket && parsed.path) attempts.push(parsed);

  if (!/^https?:\/\//i.test(value) && !value.startsWith('data:image/')) {
    const clean = value.replace(/^\/+/, '');
    attempts.push(
      { bucket: 'biomecanica', path: clean.replace(/^biomecanica\//, '') },
      { bucket: 'posturografia', path: clean.replace(/^posturografia\//, '') },
    );
  }

  for (const attempt of attempts) {
    const { data, error } = await admin.storage
      .from(attempt.bucket)
      .download(attempt.path);
    if (!error && data) {
      return bufferToDataUrl(await data.arrayBuffer(), data.type || 'image/png');
    }
  }

  return null;
}

async function tryFetchImage(raw: string): Promise<string | null> {
  const candidates = [
    raw,
    ...driveImageCandidates(raw),
    ...supabaseUrlCandidates(raw),
  ].filter(Boolean);

  for (const candidate of candidates) {
    try {
      const res = await fetch(candidate, { cache: 'no-store', redirect: 'follow' });
      const mime = res.headers.get('content-type') || 'image/png';
      if (res.ok && mime.startsWith('image/')) {
        return bufferToDataUrl(await res.arrayBuffer(), mime);
      }
    } catch {
      // Tenta o proximo candidato.
    }
  }

  return null;
}

async function urlToDataUrl(raw: string, admin: any): Promise<string> {
  const value = String(raw || '').trim();
  if (!value || value.startsWith('data:image/')) return value;

  const storageImage = await tryDownloadFromStorage(value, admin);
  if (storageImage) return storageImage;

  const fetchedImage = await tryFetchImage(value);
  if (fetchedImage) return fetchedImage;

  // Se a imagem externa falhar, mantem a URL original para o template ainda tentar renderizar.
  return value;
}

export async function hidratarImagensBiomecanicaParaPdf(biomecanica: any, admin: any) {
  if (!biomecanica) return biomecanica;

  const graficos = biomecanica.graficos && typeof biomecanica.graficos === 'object'
    ? { ...biomecanica.graficos }
    : {};

  const frame = biomecanica.foto_frame_url
    ?? biomecanica.frame_url
    ?? biomecanica.frameUrl
    ?? graficos.foto_frame_url
    ?? graficos.frame_url
    ?? graficos.frameUrl
    ?? graficos.frame;

  const graficoKeys = [
    'foto_frame_url', 'frame_url', 'frameUrl', 'frame',
    'sagital_1_url', 'sagital_2_url', 'sagital_3_url',
    'posterior_1_url', 'posterior_2_url', 'posterior_3_url',
    'posterior_4_url', 'posterior_5_url', 'posterior_6_url',
    'ombro_url', 'cotovelo_url', 'quadril_url', 'joelho_url', 'tornozelo_url',
  ];

  await Promise.all(graficoKeys.map(async (key) => {
    if (graficos[key]) graficos[key] = await urlToDataUrl(graficos[key], admin);
  }));

  return {
    ...biomecanica,
    foto_frame_url: frame ? await urlToDataUrl(frame, admin) : biomecanica.foto_frame_url,
    graficos,
  };
}
