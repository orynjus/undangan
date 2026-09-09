/**
 * Cloudflare Pages Functions: /api/rsvps
 */

export async function onRequestGet(context) {
  const { env } = context;
  let rsvps = [];

  if (env && env.WEDDING_KV) {
    try {
      const val = await env.WEDDING_KV.get('rsvps_list');
      if (val) rsvps = JSON.parse(val);
    } catch (e) {}
  }

  return new Response(JSON.stringify(rsvps), {
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
    const item = {
      id: 'rsvp_' + Date.now(),
      name: body.name || 'Tamu',
      pax: body.pax || '1',
      attendance: body.attendance || 'Hadir',
      inviteId: body.inviteId || 'default',
      date: new Date().toISOString()
    };

    if (env && env.WEDDING_KV) {
      let rsvps = [];
      try {
        const val = await env.WEDDING_KV.get('rsvps_list');
        if (val) rsvps = JSON.parse(val);
      } catch (e) {}
      rsvps.unshift(item);
      await env.WEDDING_KV.put('rsvps_list', JSON.stringify(rsvps));
    }

    return new Response(JSON.stringify({ success: true, data: item }), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
