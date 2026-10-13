
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    const url = new URL(req.url);
    const path = url.pathname;

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        // Route: Profile
        if (path.endsWith('/profile')) {
            return await handleProfile(req, supabase, url);
        }

        // Route: Addresses
        if (path.endsWith('/addresses')) {
            return await handleAddresses(req, supabase, url);
        }

        // Default: try to guess based on query params or body? 
        // Or return 404 if path is just /customer
        return new Response(JSON.stringify({ error: 'Endpoint not found. Use /profile or /addresses' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});


async function handleProfile(req: Request, supabase: any, url: URL) {
    const phone = url.searchParams.get('phone');
    if (!phone) {
        return new Response(JSON.stringify({ error: 'Phone number required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (req.method === 'GET') {
        const { data, error } = await supabase.from('customers').select('*').eq('phone', phone).maybeSingle();
        if (error) throw error;
        return new Response(JSON.stringify({ customer: data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (req.method === 'POST') {
        const { name, email } = await req.json();
        const updateData: any = { updated_at: new Date().toISOString() };
        if (name) updateData.name = name;
        if (email) updateData.email = email;

        const { data, error } = await supabase.from('customers').update(updateData).eq('phone', phone).select().single();
        if (error) throw error;
        return new Response(JSON.stringify({ success: true, customer: data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}


async function handleAddresses(req: Request, supabase: any, url: URL) {
    if (req.method === 'GET') {
        const phone = url.searchParams.get('phone');
        if (!phone) return new Response(JSON.stringify({ error: 'Phone number required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

        const { data: customer } = await supabase.from('customers').select('id').eq('phone', phone).maybeSingle();
        if (!customer) return new Response(JSON.stringify({ addresses: [] }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

        const { data: addresses, error } = await supabase.from('customer_addresses').select('*').eq('customer_id', customer.id).order('is_default', { ascending: false }).order('created_at', { ascending: false });
        if (error) throw error;

        return new Response(JSON.stringify({ addresses: addresses || [] }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (req.method === 'POST') {
        const body = await req.json();
        const { phone, customer_phone, id, full_name, name, address_line, address, area, city, state, pincode, is_default, isDefault } = body;
        const targetPhone = customer_phone || phone; // Phone to identify customer

        if (!targetPhone) return new Response(JSON.stringify({ error: 'Customer phone required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

        const { data: customer } = await supabase.from('customers').select('id').eq('phone', targetPhone).maybeSingle();
        if (!customer) return new Response(JSON.stringify({ error: 'Customer not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

        const addressData: any = {
            customer_id: customer.id,
            full_name: full_name || name || 'Customer',
            phone: phone || targetPhone, // Phone for the address entry itself
            address_line: address_line || address || '',
            area: area || '',
            city: city || 'Unknown',
            state: state || 'Unknown',
            pincode: pincode || '',
            is_default: is_default !== undefined ? is_default : (isDefault || false)
        };

        if (id) {
            const { error } = await supabase.from('customer_addresses').update({ ...addressData, updated_at: new Date().toISOString() }).eq('id', id).eq('customer_id', customer.id);
            if (error) throw error;
        } else {
            const { error } = await supabase.from('customer_addresses').insert([addressData]);
            if (error) throw error;
        }

        if (addressData.is_default) {
            await supabase.from('customer_addresses').update({ is_default: false }).eq('customer_id', customer.id).neq('id', id || '00000000-0000-0000-0000-000000000000');
        }

        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (req.method === 'DELETE') {
        const id = url.searchParams.get('id');
        const phone = url.searchParams.get('phone');
        if (!id || !phone) return new Response(JSON.stringify({ error: 'ID and Phone required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

        const { data: customer } = await supabase.from('customers').select('id').eq('phone', phone).maybeSingle();
        if (!customer) return new Response(JSON.stringify({ error: 'Customer not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

        const { error } = await supabase.from('customer_addresses').delete().eq('id', id).eq('customer_id', customer.id);
        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}
