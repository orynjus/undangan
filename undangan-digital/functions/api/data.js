/**
 * Cloudflare Pages Functions: /api/data
 * Mendukung GET dan POST data undangan di edge server Cloudflare
 */

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const id = url.searchParams.get('id') || url.searchParams.get('client') || url.searchParams.get('c');

  // 1. Cek dari Cloudflare KV jika ada binding WEDDING_KV
  if (env && env.WEDDING_KV) {
    try {
      const key = id ? `client_${id}` : 'master_data';
      const val = await env.WEDDING_KV.get(key);
      if (val) {
        return new Response(val, {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
    } catch (e) {}
  }

  // 2. Fallback: Ambil dari file static JSON di project
  try {
    const staticPath = id ? `/data/clients/${encodeURIComponent(id)}.json` : '/data/wedding-data.json';
    const staticUrl = new URL(staticPath, request.url);
    const staticRes = await fetch(staticUrl);
    if (staticRes.ok) {
      return new Response(staticRes.body, {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Fallback kedua ke data master
    const masterRes = await fetch(new URL('/data/wedding-data.json', request.url));
    if (masterRes.ok) {
      return new Response(masterRes.body, {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  } catch (e) {}

  return new Response(JSON.stringify({ error: 'Data tidak ditemukan' }), {
    status: 404,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const data = await request.json();

    // Simpan ke Cloudflare KV jika terhubung
    if (env && env.WEDDING_KV) {
      const slug = data.slug || 'kirana-bayu';
      await env.WEDDING_KV.put('master_data', JSON.stringify(data));
      await env.WEDDING_KV.put(`client_${slug}`, JSON.stringify(data));
    }

    return new Response(JSON.stringify({ success: true, message: 'Data undangan berhasil disimpan di Cloudflare Edge' }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
