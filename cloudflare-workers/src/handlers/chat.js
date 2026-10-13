import { createSupabaseAdmin } from '../utils/supabase';
import { getCORSHeaders } from '../utils/cors';
import { checkRateLimit } from '../utils/helpers';

// Gemini Chat Handler (REST API)
export async function handleChatRequest(request, env) {
    if (request.method === 'OPTIONS') {
        return new Response('ok', { headers: getCORSHeaders(env, request) });
    }

    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json', ...getCORSHeaders(env, request) },
        });
    }

    try {
        // Rate limit (DoS/cost protection)
        const rl = await checkRateLimit(request, env, {
            keyPrefix: 'chat',
            limit: 30,      // 30 requests
            windowSec: 300, // per 5 minutes per IP
        });
        if (!rl.allowed) {
            return new Response(JSON.stringify({
                error: 'Too many requests. Please try again later.',
                retry_after_seconds: rl.resetTime,
            }), {
                status: 429,
                headers: {
                    'Content-Type': 'application/json',
                    'Retry-After': String(rl.resetTime || 60),
                    ...getCORSHeaders(env, request),
                }
            });
        }

        const { message, history } = await request.json();
        const apiKey = env.GEMINI_API_KEY || env.GOOGLE_API_KEY;

        if (!apiKey) {
            throw new Error("GEMINI_API_KEY or GOOGLE_API_KEY is not set in Worker environment");
        }

        // 1. Authenticate Customer (Parse Session Cookie directly if possible, or assume passed in body??)
        // In Workers, cookies are in request.headers.get('Cookie')
        // But our frontend passes cookies automatically.
        // Let's try to parse 'samar-customer-session'
        const cookieHeader = request.headers.get('Cookie');
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
            ...(history || []).map(msg => ({
                role: msg.role === 'bot' ? 'model' : 'user', // Map 'bot' to 'model'
                parts: [{ text: msg.content }]
            })),
            {
                role: "user",
                parts: [{ text: message }]
            }
        ];

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

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

        // Handle Function Calling logic locally (multi-turn via REST is manual)
        // If Gemini wants to call a function, we execute it and call Gemini again.

        let finalReply = "I'm sorry, I couldn't understand that.";

        // Check if candidate has function call
        const candidate = data.candidates?.[0]?.content;
        const parts = candidate?.parts || [];
        const functionCallPart = parts.find(p => p.functionCall);

        if (functionCallPart) {
            const fn = functionCallPart.functionCall;
            const fnName = fn.name;
            const fnArgs = fn.args;
            let fnResult = "";

            if (fnName === "get_my_orders") {
                if (!customerId) {
                    fnResult = "User is not logged in. Ask them to login to view orders.";
                } else {
                    // Call Supabase
                    const supabase = createSupabaseAdmin(env);
                    const { data: orders, error } = await supabase
                        .from("orders")
                        .select("id, status, total_amount, created_at") // Removed 'items' to save tokens, add back if needed
                        .eq("customer_id", customerId)
                        .order("created_at", { ascending: false })
                        .limit(3);

                    if (error) fnResult = `Error: ${error.message}`;
                    else if (!orders?.length) fnResult = "No recent orders found.";
                    else fnResult = JSON.stringify(orders);
                }
            } else if (fnName === "search_products") {
                const query = fnArgs.query;
                const supabase = createSupabaseAdmin(env);
                const { data: products } = await supabase
                    .from("products")
                    .select("id, name, price, inventory, category")
                    .ilike("name", `%${query}%`)
                    .limit(4);

                if (!products?.length) fnResult = "No products found.";
                else fnResult = JSON.stringify(products);
            } else if (fnName === "get_policy") {
                const policies = {
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
                    response: { name: fnName, content: fnResult } // Correct REST format? Check docs. REST API expects 'response' object
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
            headers: { 'Content-Type': 'application/json', ...getCORSHeaders(env, request) }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...getCORSHeaders(env, request) }
        });
    }
}
