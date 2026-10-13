import { createClient } from '@supabase/supabase-js';

// Create Supabase admin client
export function createSupabaseAdmin(env) {
    const supabaseUrl = env?.SUPABASE_URL;
    const supabaseKey = env?.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        throw new Error(
            `Missing Supabase env. SUPABASE_URL=${Boolean(supabaseUrl)} SUPABASE_SERVICE_ROLE_KEY=${Boolean(supabaseKey)}`
        );
    }

    return createClient(
        supabaseUrl,
        supabaseKey,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );
}
