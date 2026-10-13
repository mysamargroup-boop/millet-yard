import { createSupabaseAdmin } from '../utils/supabase';
import { getCORSHeaders } from '../utils/cors';
import { cachedJson, getCacheControl } from '../utils/edge-cache';

export async function handleVideos(request, env) {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: getCORSHeaders(env, request) });
  }

  try {
    const supabase = createSupabaseAdmin(env);

    if (request.method === 'GET') {
      return await cachedJson(
        request,
        env,
        async () => {
          const { data, error } = await supabase
            .from('videos')
            .select('*')
            .order('created_at', { ascending: false });

          if (error) throw error;

          return new Response(JSON.stringify(data || []), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': getCacheControl(env, { browserTtl: 60, edgeTtl: 300 }),
              ...getCORSHeaders(env, request),
            },
          });
        },
        { cacheControl: getCacheControl(env, { browserTtl: 60, edgeTtl: 300 }) }
      );
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...getCORSHeaders(env, request) },
    });
  } catch (error) {
    const message =
      error && typeof error === 'object' && 'message' in error
        ? String(error.message)
        : 'Unexpected error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...getCORSHeaders(env, request) },
    });
  }
}

export async function handleTestimonials(request, env) {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: getCORSHeaders(env, request) });
  }

  try {
    const supabase = createSupabaseAdmin(env);

    if (request.method === 'GET') {
      return await cachedJson(
        request,
        env,
        async () => {
          const { data, error } = await supabase
            .from('testimonials')
            .select('*')
            .eq('is_visible', true)
            .order('created_at', { ascending: false });

          if (error) throw error;

          return new Response(JSON.stringify(data || []), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': getCacheControl(env, { browserTtl: 60, edgeTtl: 300 }),
              ...getCORSHeaders(env, request),
            },
          });
        },
        { cacheControl: getCacheControl(env, { browserTtl: 60, edgeTtl: 300 }) }
      );
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...getCORSHeaders(env, request) },
    });
  } catch (error) {
    const message =
      error && typeof error === 'object' && 'message' in error
        ? String(error.message)
        : 'Unexpected error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...getCORSHeaders(env, request) },
    });
  }
}

