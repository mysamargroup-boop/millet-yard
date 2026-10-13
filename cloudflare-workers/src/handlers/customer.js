import { createSupabaseAdmin } from '../utils/supabase';
import { getCORSHeaders } from '../utils/cors';

// Address Book Handler (Row-based)
export async function handleCustomerAddresses(request, env) {
    if (request.method === 'OPTIONS') {
        return new Response('ok', { headers: getCORSHeaders(env, request) });
    }

    const supabase = createSupabaseAdmin(env);

    try {
        if (request.method === 'GET') {
            const url = new URL(request.url);
            const phone = url.searchParams.get('phone');

            if (!phone) {
                return new Response(JSON.stringify({ error: 'Phone number required' }), { status: 400, headers: getCORSHeaders(env, request) });
            }

            // 1. Find customer ID
            const { data: customer } = await supabase
                .from('customers')
                .select('id')
                .eq('phone', phone)
                .maybeSingle();

            if (!customer) {
                return new Response(JSON.stringify({ addresses: [] }), { status: 200, headers: getCORSHeaders(env, request) });
            }

            // 2. Fetch addresses from the new table
            const { data: addresses, error } = await supabase
                .from('customer_addresses')
                .select('*')
                .eq('customer_id', customer.id)
                .order('is_default', { ascending: false })
                .order('created_at', { ascending: false });

            if (error) throw error;

            return new Response(JSON.stringify({ addresses: addresses || [] }), {
                status: 200,
                headers: { 'Content-Type': 'application/json', ...getCORSHeaders(env, request) }
            });
        }

        if (request.method === 'POST') {
            const url = new URL(request.url);
            const customer_phone_query = url.searchParams.get('phone');

            const body = await request.json();
            const {
                phone: body_phone, // Could be customer identification or address-specific phone
                customer_phone: body_customer_phone,
                id,
                full_name, name,
                address_line, address,
                area,
                city, state,
                pincode,
                is_default, isDefault
            } = body;

            const customer_phone = customer_phone_query || body_customer_phone || body_phone;

            if (!customer_phone) {
                return new Response(JSON.stringify({ error: 'Customer phone required' }), { status: 400, headers: getCORSHeaders(env, request) });
            }

            // 1. Find customer ID
            const { data: customer } = await supabase
                .from('customers')
                .select('id')
                .eq('phone', customer_phone)
                .maybeSingle();

            if (!customer) {
                return new Response(JSON.stringify({ error: 'Customer not found' }), { status: 404, headers: getCORSHeaders(env, request) });
            }

            const addressData = {
                customer_id: customer.id,
                full_name: full_name || name || 'Customer',
                phone: body_phone || customer_phone,
                address_line: address_line || address || '',
                area: area || '',
                city: city || 'Unknown',
                state: state || 'Unknown',
                pincode: pincode || '',
                is_default: is_default !== undefined ? is_default : (isDefault || false)
            };

            if (id) {
                // Update
                const { error } = await supabase
                    .from('customer_addresses')
                    .update({
                        ...addressData,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', id)
                    .eq('customer_id', customer.id);
                if (error) throw error;
            } else {
                // Insert
                const { error } = await supabase
                    .from('customer_addresses')
                    .insert([addressData]);
                if (error) throw error;
            }

            // If this is set as default, unset others (simplistic approach)
            if (addressData.is_default) {
                await supabase
                    .from('customer_addresses')
                    .update({ is_default: false })
                    .eq('customer_id', customer.id)
                    .neq('id', id || '00000000-0000-0000-0000-000000000000'); // ID might be new, but it's okay for now
            }

            return new Response(JSON.stringify({ success: true }), {
                status: 200,
                headers: { 'Content-Type': 'application/json', ...getCORSHeaders(env, request) }
            });
        }

        if (request.method === 'DELETE') {
            const url = new URL(request.url);
            const id = url.searchParams.get('id');
            const phone = url.searchParams.get('phone'); // Extra security check

            if (!id || !phone) {
                return new Response(JSON.stringify({ error: 'ID and Phone required' }), { status: 400, headers: getCORSHeaders(env, request) });
            }

            // 1. Find customer ID
            const { data: customer } = await supabase
                .from('customers')
                .select('id')
                .eq('phone', phone)
                .maybeSingle();

            if (!customer) {
                return new Response(JSON.stringify({ error: 'Customer not found' }), { status: 404, headers: getCORSHeaders(env, request) });
            }

            const { error } = await supabase
                .from('customer_addresses')
                .delete()
                .eq('id', id)
                .eq('customer_id', customer.id);

            if (error) throw error;

            return new Response(JSON.stringify({ success: true }), {
                status: 200,
                headers: { 'Content-Type': 'application/json', ...getCORSHeaders(env, request) }
            });
        }

        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: getCORSHeaders(env, request) });

    } catch (error) {
        console.error('Address API Error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: getCORSHeaders(env, request) });
    }
}


// Route: GET/POST /api/account/profile
export async function handleCustomerProfile(request, env) {
    if (request.method === 'OPTIONS') {
        return new Response('ok', { headers: getCORSHeaders(env, request) });
    }

    const supabase = createSupabaseAdmin(env);
    const url = new URL(request.url);
    const phone = url.searchParams.get('phone');

    if (!phone) {
        return new Response(JSON.stringify({ error: 'Phone number required' }), { status: 400, headers: getCORSHeaders(env, request) });
    }

    try {
        if (request.method === 'GET') {
            const { data, error } = await supabase
                .from('customers')
                .select('*')
                .eq('phone', phone)
                .maybeSingle();

            if (error) throw error;
            return new Response(JSON.stringify({ customer: data }), { status: 200, headers: { 'Content-Type': 'application/json', ...getCORSHeaders(env, request) } });
        }

        if (request.method === 'POST') {
            const { name, email } = await request.json();

            const updateData = { updated_at: new Date().toISOString() };
            if (name) updateData.name = name;
            if (email) updateData.email = email;

            const { data, error } = await supabase
                .from('customers')
                .update(updateData)
                .eq('phone', phone)
                .select()
                .single();

            if (error) throw error;

            return new Response(JSON.stringify({ success: true, customer: data }), {
                status: 200,
                headers: { 'Content-Type': 'application/json', ...getCORSHeaders(env, request) }
            });
        }

        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: getCORSHeaders(env, request) });

    } catch (error) {
        console.error('Profile API Error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: getCORSHeaders(env, request) });
    }
}
