/**
 * Cloudflare Pages Functions: /api/settings
 */

export async function onRequestGet(context) {
  const { env } = context;
  let requireApproval = false;

  if (env && env.WEDDING_KV) {
    try {
      const val = await env.WEDDING_KV.get('setting_require_approval');
      if (val !== null) requireApproval = val === 'true';
    } catch (e) {}
  }

  return new Response(JSON.stringify({ requireApproval }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await request.json();
    if (env && env.WEDDING_KV && typeof body.requireApproval === 'boolean') {
      await env.WEDDING_KV.put('setting_require_approval', String(body.requireApproval));
    }
    return new Response(JSON.stringify({ success: true }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
