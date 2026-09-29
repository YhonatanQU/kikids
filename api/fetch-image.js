// Proxy server-side para importar fotos de producto desde un enlace (Drive
// u otro sitio). Corre en el servidor, no en el navegador del admin, así
// que no choca con CORS como pasaría si el frontend intentara hacer el
// fetch directo — Drive (y muchos sitios) no mandan las cabeceras CORS que
// un fetch() desde el navegador necesita para poder leer la respuesta.
//
// Para Drive además intenta leer el nombre real del archivo desde la
// página pública de vista previa (meta "og:title"), porque la URL del
// enlace para compartir no lo trae.

const DRIVE_ID_PATTERN = /drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?[^ ]*[?&]id=)([a-zA-Z0-9_-]+)/;

async function resolveDriveFilename(fileId) {
  try {
    const res = await fetch(`https://drive.google.com/file/d/${fileId}/view`);
    const html = await res.text();
    const ogTitle = html.match(/<meta property="og:title" content="([^"]+)"/);
    if (ogTitle) return ogTitle[1];
    const titleTag = html.match(/<title>([^<]+)<\/title>/);
    if (titleTag) return titleTag[1].replace(/ - Google Drive$/, '');
  } catch {
    // Sin nombre disponible — seguimos igual con la descarga.
  }
  return null;
}

export default async function handler(req, res) {
  const rawUrl = typeof req.query.url === 'string' ? req.query.url : '';
  if (!rawUrl) {
    res.status(400).json({ error: 'Falta el enlace de la imagen.' });
    return;
  }

  let downloadUrl = rawUrl;
  let filename = null;

  const driveMatch = rawUrl.match(DRIVE_ID_PATTERN);
  if (driveMatch) {
    const fileId = driveMatch[1];
    downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
    filename = await resolveDriveFilename(fileId);
  }

  let imgRes;
  try {
    imgRes = await fetch(downloadUrl, { redirect: 'follow' });
  } catch {
    res.status(502).json({ error: 'No se pudo conectar con ese enlace.' });
    return;
  }

  if (!imgRes.ok) {
    res.status(502).json({ error: 'El enlace no devolvió una imagen válida.' });
    return;
  }

  const contentType = imgRes.headers.get('content-type') || '';
  if (!contentType.startsWith('image/')) {
    res.status(422).json({
      error:
        'Ese enlace no apunta directo a una imagen (puede requerir iniciar sesión o mostrar una página en vez del archivo).',
    });
    return;
  }

  if (!filename) {
    const disposition = imgRes.headers.get('content-disposition') || '';
    const dispMatch = disposition.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
    filename = dispMatch ? decodeURIComponent(dispMatch[1]) : rawUrl.split('/').pop()?.split('?')[0] || null;
  }
  if (!filename) filename = `imagen-${Date.now()}.jpg`;

  const buffer = Buffer.from(await imgRes.arrayBuffer());
  res.setHeader('Content-Type', contentType);
  res.setHeader('X-Filename', encodeURIComponent(filename));
  res.setHeader('Access-Control-Expose-Headers', 'X-Filename');
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).send(buffer);
}
