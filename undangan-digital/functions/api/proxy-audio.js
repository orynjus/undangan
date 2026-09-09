/**
 * Cloudflare Pages Functions: /api/proxy-audio
 * Streaming audio Google Drive bebas CORS di Cloudflare Edge
 */

export async function onRequestGet(context) {
  const { request } = context;
  const url = new URL(request.url);
  let fileId = url.searchParams.get('id');
  const directUrl = url.searchParams.get('url');

  if (!fileId && directUrl) {
    const m = directUrl.match(/\/d\/([a-zA-Z0-9_-]+)/) || directUrl.match(/id=([a-zA-Z0-9_-]+)/);
    if (m && m[1]) fileId = m[1];
  }

  if (!fileId) {
    return new Response(JSON.stringify({ error: 'Parameter id file Google Drive wajib diisi' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  const driveUrl = `https://docs.google.com/uc?export=download&id=${fileId}`;

  try {
    const res = await fetch(driveUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    return new Response(res.body, {
      status: res.status,
      headers: {
        'Content-Type': res.headers.get('Content-Type') || 'audio/mpeg',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=86400'
      }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
