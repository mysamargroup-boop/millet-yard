import { getCORSHeaders } from './cors';

function getOriginKey(request) {
  return request?.headers?.get('Origin') || 'no-origin';
}

function getCacheKeyRequest(request) {
  const originKey = getOriginKey(request);
  const cacheUrl = new URL(request.url);
  // Cache API key is URL-only; vary by Origin explicitly.
  cacheUrl.searchParams.set('__o', originKey);
  return new Request(cacheUrl.toString(), { method: 'GET' });
}

export function getCacheControl(env, fallback = {}) {
  const browserTtl = Number(env?.EDGE_CACHE_BROWSER_TTL_SEC ?? fallback.browserTtl ?? 60);
  const edgeTtl = Number(env?.EDGE_CACHE_EDGE_TTL_SEC ?? fallback.edgeTtl ?? 300);
  const swr = Number(env?.EDGE_CACHE_SWR_SEC ?? fallback.swr ?? 86400);
  return `public, max-age=${browserTtl}, s-maxage=${edgeTtl}, stale-while-revalidate=${swr}`;
}

/**
 * Edge cache for public GET JSON responses.
 * - Uses Cloudflare Cache API (caches.default) when available
 * - Varies cache by Origin to avoid serving wrong CORS headers
 */
export async function cachedJson(request, env, buildResponse, opts = {}) {
  // Disable caching in local development or if cache is not available
  const isLocal = env?.ENVIRONMENT !== 'production' || !caches?.default;
  
  if (request.method !== 'GET' || isLocal) {
    const res = await buildResponse();
    // Even if not caching, ensure CORS headers are applied if missing
    if (res && isLocal) {
        const cors = getCORSHeaders(env, request);
        const headers = new Headers(res.headers);
        Object.entries(cors).forEach(([k, v]) => {
            if (!headers.has(k)) headers.set(k, v);
        });
        return new Response(res.body, { status: res.status, headers });
    }
    return res;
  }

  const cache = caches.default;

  const cacheKeyReq = getCacheKeyRequest(request);
  const hit = await cache.match(cacheKeyReq);
  if (hit) return hit;

  const res = await buildResponse();

  // Only cache successful JSON responses
  if (!res || res.status !== 200) return res;

  const headers = new Headers(res.headers);
  headers.set('Cache-Control', opts.cacheControl || getCacheControl(env, opts));
  headers.set('Vary', 'Origin');

  // ensure CORS headers exist for cached copy
  const cors = getCORSHeaders(env, request);
  Object.entries(cors).forEach(([k, v]) => headers.set(k, v));

  const body = await res.clone().text();
  const cached = new Response(body, { status: res.status, headers });

  // Best-effort cache put
  try {
    await cache.put(cacheKeyReq, cached.clone());
  } catch {
    // ignore cache put failures
  }

  return cached;
}

