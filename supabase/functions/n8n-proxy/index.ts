/**
 * N8N CORS Proxy Edge Function
 * 
 * This Supabase Edge Function acts as a proxy to avoid CORS issues
 * when the frontend tries to communicate with n8n directly.
 */

console.info('n8n-proxy function starting');

const N8N_BASE_URL = Deno.env.get('N8N_BASE_URL');
const N8N_API_KEY = Deno.env.get('N8N_API_KEY');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-N8N-API-KEY, x-client-info, apikey',
  'Access-Control-Max-Age': '86400'
};

function buildFullUrl(base: string, endpoint: string) {
  const trimmedBase = base.replace(/\/+$/, '');
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${trimmedBase}${normalizedEndpoint}`;
}

Deno.serve(async (req: Request) => {
  // Preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: CORS_HEADERS });
  }

  try {
    // Try to parse JSON body safely; if not JSON, fallback to text.
    let payload: any = {};
    const contentType = req.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      payload = await req.json();
    } else {
      const text = await req.text();
      try {
        payload = text ? JSON.parse(text) : {};
      } catch {
        // not JSON, leave as empty payload
        payload = {};
      }
    }

    const endpoint: string = payload?.endpoint;
    const method: string = (payload?.method || 'GET').toUpperCase();
    const headersFromClient: Record<string, string> = payload?.headers || {};
    const bodyPayload = payload?.body ?? null;

    if (!endpoint || typeof endpoint !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing or invalid endpoint' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      });
    }

    const fullUrl = buildFullUrl(N8N_BASE_URL, endpoint);

    const n8nHeaders: Record<string, string> = {
      ...headersFromClient,
      'X-N8N-API-KEY': N8N_API_KEY,
    };

    // Set Content-Type only when there is a body and client didn't already set it
    if (bodyPayload && !Object.keys(n8nHeaders).some(k => k.toLowerCase() === 'content-type')) {
      n8nHeaders['Content-Type'] = 'application/json';
    }

    // Remove Content-Type if no body
    if (!bodyPayload && Object.keys(n8nHeaders).some(k => k.toLowerCase() === 'content-type')) {
      for (const key of Object.keys(n8nHeaders)) {
        if (key.toLowerCase() === 'content-type') {
          delete n8nHeaders[key];
        }
      }
    }

    console.log(`Proxying ${method} ${fullUrl}`);

    const resp = await fetch(fullUrl, {
      method,
      headers: n8nHeaders,
      body: bodyPayload ? JSON.stringify(bodyPayload) : undefined,
    });

    const respContentType = resp.headers.get('content-type') ?? '';
    let respBody: any;
    if (respContentType.includes('application/json')) {
      respBody = await resp.json();
    } else {
      respBody = await resp.text();
    }

    // Ensure we return JSON to client; if n8n returned non-JSON, wrap it
    const outBody = (typeof respBody === 'string') ? { result: respBody } : respBody;

    return new Response(JSON.stringify(outBody), {
      status: resp.status,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });

  } catch (err: any) {
    console.error('Proxy error', err);
    return new Response(JSON.stringify({ error: 'Proxy request failed', message: err?.message ?? String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }
});
