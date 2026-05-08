// Proxies /api/obelix/* requests to the internal Quickteller host.
// Allows the HTTPS preview to reach the plain-HTTP internal Kubernetes service.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, accept',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
};

const UPSTREAM = Deno.env.get('OBELIX_UPSTREAM_URL') ??
  'http://quickteller-merchant-ui.test.kube.iswke';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  // Strip the function path prefix; everything after becomes the upstream path.
  // Function is invoked at /functions/v1/obelix-proxy/<rest>
  const marker = '/obelix-proxy';
  const idx = url.pathname.indexOf(marker);
  const rest = idx >= 0 ? url.pathname.slice(idx + marker.length) : url.pathname;
  const upstreamUrl = `${UPSTREAM}${rest}${url.search}`;

  // Clone headers, drop hop-by-hop & host
  const headers = new Headers();
  req.headers.forEach((v, k) => {
    const lk = k.toLowerCase();
    if (['host', 'content-length', 'connection', 'accept-encoding'].includes(lk)) return;
    if (lk.startsWith('x-forwarded-') || lk.startsWith('cf-') || lk.startsWith('sb-')) return;
    headers.set(k, v);
  });

  const init: RequestInit = {
    method: req.method,
    headers,
    body: ['GET', 'HEAD'].includes(req.method) ? undefined : await req.arrayBuffer(),
    redirect: 'manual',
  };

  try {
    const upstreamRes = await fetch(upstreamUrl, init);
    const respHeaders = new Headers(corsHeaders);
    upstreamRes.headers.forEach((v, k) => {
      const lk = k.toLowerCase();
      if (['content-encoding', 'transfer-encoding', 'connection'].includes(lk)) return;
      respHeaders.set(k, v);
    });
    const buf = await upstreamRes.arrayBuffer();
    return new Response(buf, { status: upstreamRes.status, headers: respHeaders });
  } catch (e) {
    return new Response(
      JSON.stringify({
        code: 'PROXY_ERROR',
        description: `Upstream fetch failed: ${(e as Error).message}`,
        data: null,
      }),
      { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
