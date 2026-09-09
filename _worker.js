/**
 * Cloudflare Worker & Pages Full Edge Handler (_worker.js)
 * Mendukung penyimpanan multi-klien realtime menggunakan Cloudflare KV
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // --- 1. CORS Preflight ---
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
    }

    // --- 2. API: /api/data (Penyimpanan & Pengambilan Data Klien) ---
    if (url.pathname === '/api/data') {
      // GET Data
      if (request.method === 'GET') {
        const id = url.searchParams.get('id') || url.searchParams.get('client') || url.searchParams.get('c');
        
        if (env && env.WEDDING_KV) {
          try {
            const key = id ? `client_${id}` : 'master_data';
            const val = await env.WEDDING_KV.get(key);
            if (val) {
              return new Response(val, {
                headers: {
                  'Content-Type': 'application/json; charset=utf-8',
                  'Access-Control-Allow-Origin': '*'
                }
              });
            }
          } catch (e) {
            console.error('Error fetching from KV:', e);
          }
        }

        // Fallback file static jika ada
        if (env && env.ASSETS) {
          const staticPath = id ? `/data/clients/${encodeURIComponent(id)}.json` : '/data/wedding-data.json';
          const staticRes = await env.ASSETS.fetch(new Request(new URL(staticPath, request.url)));
          if (staticRes && staticRes.ok) {
            return new Response(staticRes.body, {
              headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Access-Control-Allow-Origin': '*'
              }
            });
          }
        }

        return new Response(JSON.stringify({ error: 'Data tidak ditemukan di database' }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }

      // POST Data (Simpan Klien Baru / Update dari Dashboard)
      if (request.method === 'POST') {
        try {
          const data = await request.json();
          const slug = data.slug || 'dwi-deni';

          if (env && env.WEDDING_KV) {
            // Simpan data spesifik klien
            await env.WEDDING_KV.put(`client_${slug}`, JSON.stringify(data));
            await env.WEDDING_KV.put('master_data', JSON.stringify(data));

            // Perbarui daftar indeks semua klien
            let list = [];
            try {
              const rawList = await env.WEDDING_KV.get('clients_index');
              if (rawList) list = JSON.parse(rawList);
            } catch (e) {}

            const existingIdx = list.findIndex(c => c.slug === slug);
            const clientMeta = {
              slug,
              brideName: data.brideName || 'Wanita',
              groomName: data.groomName || 'Pria',
              weddingDate: data.weddingDate || '',
              updatedAt: new Date().toISOString()
            };

            if (existingIdx >= 0) {
              list[existingIdx] = clientMeta;
            } else {
              list.push(clientMeta);
            }
            await env.WEDDING_KV.put('clients_index', JSON.stringify(list));

            return new Response(JSON.stringify({
              success: true,
              message: `Data undangan '${slug}' berhasil disimpan di Cloudflare KV`,
              slug
            }), {
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              }
            });
          } else {
            return new Response(JSON.stringify({
              error: 'Binding database WEDDING_KV belum dihubungkan di Dashboard Cloudflare. Silakan tambahkan KV binding dengan nama WEDDING_KV.'
            }), {
              status: 500,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              }
            });
          }
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
    }

    // --- 3. API: /api/clients (Daftar Semua Klien untuk Admin) ---
    if (url.pathname === '/api/clients') {
      if (env && env.WEDDING_KV) {
        try {
          const raw = await env.WEDDING_KV.get('clients_index');
          const list = raw ? JSON.parse(raw) : [];
          return new Response(JSON.stringify(list), {
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          });
        } catch (e) {}
      }
      return new Response(JSON.stringify([]), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // --- 4. Sajikan Asset Statis (HTML, CSS, JS, Gambar) ---
    if (env && env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('Not found', { status: 404 });
  }
};
