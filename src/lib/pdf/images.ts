function bufferToDataUrl(bytes: ArrayBuffer, mimeType: string) {
  return `data:${mimeType || 'image/png'};base64,${Buffer.from(bytes).toString('base64')}`;
}

function parseSupabaseStorageUrl(raw: string) {
  try {
    const url = new URL(raw);
    const match = url.pathname.match(/\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/(.+)$/);
    if (!match) return null;
    return {
      bucket: decodeURIComponent(match[1]),
      path: decodeURIComponent(match[2]),
    };
  } catch {
    return null;
  }
}

async function urlToDataUrl(raw: string, admin: any): Promise<string> {
  const value = String(raw || '').trim();
  if (!value || value.startsWith('data:image/')) return value;

  const supabasePath = parseSupabaseStorageUrl(value);
  if (supabasePath?.bucket && supabasePath.path) {
    const { data, error } = await admin.storage
      .from(supabasePath.bucket)
      .download(supabasePath.path);
    if (!error && data) {
      return bufferToDataUrl(await data.arrayBuffer(), data.type || 'image/png');
    }
  }

  try {
    const res = await fetch(value, { cache: 'no-store' });
    const mime = res.headers.get('content-type') || 'image/png';
    if (res.ok && mime.startsWith('image/')) {
      return bufferToDataUrl(await res.arrayBuffer(), mime);
    }
  } catch {
    // Se a imagem externa falhar, mantem a URL original para o template ainda tentar renderizar.
  }

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
