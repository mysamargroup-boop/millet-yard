
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    // CORS Preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    try {
        const { message, history } = await req.json();
        const apiKey = Deno.env.get('GEMINI_API_KEY');

        if (!apiKey) {
            throw new Error("GEMINI_API_KEY is not set");
        }

        // Authenticate Customer via Cookie
        const cookieHeader = req.headers.get('Cookie');
        let customerId = null;
        let customerName = "Guest";

        if (cookieHeader) {
            const match = cookieHeader.match(/samar-customer-session=([^;]+)/);
            if (match) {
                try {
                    const sessionData = JSON.parse(decodeURIComponent(match[1]));
                    customerId = sessionData.id;
                    customerName = sessionData.name || "Customer";
                } catch (e) {
                    // ignore
                }
            }
        }

        // Tools Definition
        const tools = [
            {
                name: "get_my_orders",
                description: "Fetches recent orders for the authenticated user",
            },
            {
                name: "search_products",
                description: "Searches products",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        query: { type: "STRING", description: "Search keyword" }
                    },
                    required: ["query"]
                }
            },
            {
                name: "get_policy",
                description: "Returns policy text",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        type: { type: "STRING", enum: ["returns", "shipping", "refunds", "support"] }
                    },
                    required: ["type"]
                }
            }
        ];

        // Prepare content for Gemini REST API
        const contents = [
            {
                role: "user",
                parts: [{ text: `System: You are 'Samar AI', a helpful shopping assistant for Samar Store. Your goal is to help customers find products, check orders, and answer policy questions. Be polite, concise, and professional. Current (Simulated) User: ${customerName}. Logged In: ${!!customerId}. Only answer e-commerce related queries.` }]
            },
            {
                role: "model",
                parts: [{ text: "Namaste! 🙏 I am ready to help you with your shopping at Samar Store." }]
            },
            ...(history || []).map((msg: any) => ({
                role: msg.role === 'bot' ? 'model' : 'user',
                parts: [{ text: msg.content }]
            })),
            {
                role: "user",
                parts: [{ text: message }]
            }
        ];

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

        const payload = {
            contents,
            tools: [{ function_declarations: tools }]
        };

        let response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        let data = await response.json();

        let finalReply = "I'm sorry, I couldn't understand that.";
        const candidate = data.candidates?.[0]?.content;
        const parts = candidate?.parts || [];
        const functionCallPart = parts.find((p: any) => p.functionCall);

        if (functionCallPart) {
            const fn = functionCallPart.functionCall;
            const fnName = fn.name;
            const fnArgs = fn.args;
            let fnResult = "";

            const supabase = createClient(
                Deno.env.get('SUPABASE_URL') ?? '',
                Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
                { auth: { autoRefreshToken: false, persistSession: false } }
            );

            if (fnName === "get_my_orders") {
                if (!customerId) {
                    fnResult = "User is not logged in. Ask them to login to view orders.";
                } else {
                    const { data: orders, error } = await supabase
                        .from("orders")
                        .select("id, status, total_amount, created_at")
                        .eq("customer_id", customerId)
                        .order("created_at", { ascending: false })
                        .limit(3);

                    if (error) fnResult = `Error: ${error.message}`;
                    else if (!orders?.length) fnResult = "No recent orders found.";
                    else fnResult = JSON.stringify(orders);
                }
            } else if (fnName === "search_products") {
                const query = fnArgs.query;
                const { data: products } = await supabase
                    .from("products")
                    .select("id, name, price, inventory, category")
                    .ilike("name", `%${query}%`)
                    .limit(4);

                if (!products?.length) fnResult = "No products found.";
                else fnResult = JSON.stringify(products);
            } else if (fnName === "get_policy") {
                const policies: Record<string, string> = {
                    returns: "Returns accepted within 7 days for damaged/incorrect items. Contact support.",
                    shipping: "Shipping takes 5-7 business days across India.",
                    refunds: "Refunds processed in 5-7 days after approval.",
                    support: "Contact support@samarstore.com or +91-9876543210 (10 AM - 6 PM)."
                };
                fnResult = policies[fnArgs.type] || "Policy not found.";
            }

            // Send result back to Gemini
            const functionResponsePart = {
                functionResponse: {
                    name: fnName,
                    response: { name: fnName, content: { result: fnResult } }
                }
            };

            const payload2 = {
                contents: [
                    ...contents,
                    candidate, // The model's request to call function
                    { role: "function", parts: [functionResponsePart] } // The result
                ],
                tools: [{ function_declarations: tools }]
            };

            const res2 = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload2)
            });
            const data2 = await res2.json();

            finalReply = data2.candidates?.[0]?.content?.parts?.[0]?.text || "Required info processed.";

        } else {
            finalReply = parts[0]?.text || "I didn't get that.";
        }

        return new Response(JSON.stringify({ reply: finalReply }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
